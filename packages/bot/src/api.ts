import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { Address } from '@ton/core';
import { config } from './config';
import { buildMintBody, sendMintTransaction } from './services/mint';
import { checkMintRateLimit } from './middleware/rateLimit';
import { getSDK } from './services/passport';
import { calculateTrustScore } from './services/reputation';
import { isInitialized as isWalletReady } from './services/directWallet';

function isValidHttpUrl(str: string): boolean {
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function createApiServer() {
    const app = express();
    app.set('trust proxy', 'loopback');

    const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean);
    if (corsOrigins && corsOrigins.length > 0) {
        app.use(cors({ origin: corsOrigins }));
    }
    app.use(express.json({ limit: '10kb' }));

    // Health check — no wallet state leak
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok' });
    });

    // Auto-mint endpoint
    app.post('/api/mint', async (req, res) => {
        try {
            const { owner, endpoint, capabilities, metadata } = req.body;

            // Validate required fields
            if (!owner || !endpoint || !capabilities || !metadata) {
                res.status(400).json({ error: 'All fields are required (owner, endpoint, capabilities, metadata)' });
                return;
            }

            // Validate field lengths
            const MAX_LEN = 256;
            if (owner.length > 100 || endpoint.length > MAX_LEN ||
                capabilities.length > MAX_LEN || metadata.length > MAX_LEN) {
                res.status(400).json({ error: 'Field too long (max 256 chars)' });
                return;
            }

            // Validate TON address
            let ownerAddress: Address;
            try {
                ownerAddress = Address.parse(owner);
            } catch {
                res.status(400).json({ error: 'Invalid TON address' });
                return;
            }

            // Validate URLs
            if (!isValidHttpUrl(endpoint)) {
                res.status(400).json({ error: 'endpoint must be a valid http/https URL' });
                return;
            }
            if (!isValidHttpUrl(metadata)) {
                res.status(400).json({ error: 'metadata must be a valid http/https URL' });
                return;
            }

            // Rate limiting — skip if valid admin API key provided
            const apiKey = req.headers['x-admin-api-key'] as string | undefined;
            const hasValidKey = config.adminApiKey && apiKey && timingSafeEqual(apiKey, config.adminApiKey);
            if (!hasValidKey) {
                const identifier = req.ip || 'unknown';
                if (!checkMintRateLimit(identifier)) {
                    res.status(429).json({ error: 'Please wait 60 seconds between mints' });
                    return;
                }
            }

            // Check direct wallet is ready
            if (!isWalletReady()) {
                res.status(503).json({ error: 'Wallet not initialized. Check MNEMONIC in .env.' });
                return;
            }

            // Build and send mint transaction
            const mintBody = buildMintBody({
                queryId: BigInt(Date.now()),
                owner: ownerAddress,
                capabilities,
                endpoint,
                metadataUrl: metadata,
            });

            const txHash = await sendMintTransaction(config.registryAddress, mintBody);

            res.json({
                success: true,
                txHash: txHash || 'pending',
                message: 'Passport minted successfully',
            });
        } catch (error: any) {
            console.error('Auto-mint error:', error);
            res.status(500).json({ error: 'Mint failed' });
        }
    });

    // Public mint payload endpoint — returns tx payload for TON Connect signing
    app.post('/api/public-mint-payload', async (req, res) => {
        try {
            const { owner, endpoint, capabilities, metadata } = req.body;

            if (!owner || !endpoint || !capabilities || !metadata) {
                res.status(400).json({ error: 'All fields required (owner, endpoint, capabilities, metadata)' });
                return;
            }

            const MAX_LEN = 256;
            if (endpoint.length > MAX_LEN || capabilities.length > MAX_LEN || metadata.length > MAX_LEN) {
                res.status(400).json({ error: 'Field too long (max 256 chars)' });
                return;
            }

            if (!isValidHttpUrl(endpoint)) {
                res.status(400).json({ error: 'endpoint must be a valid http/https URL' });
                return;
            }
            if (!isValidHttpUrl(metadata)) {
                res.status(400).json({ error: 'metadata must be a valid http/https URL' });
                return;
            }

            let ownerAddress: Address;
            try {
                ownerAddress = Address.parse(owner);
            } catch {
                res.status(400).json({ error: 'Invalid TON address' });
                return;
            }

            // PublicMintPassport opcode from compiled Tact contract
            const PUBLIC_MINT_OPCODE = 534822672;
            const { beginCell: bc } = await import('@ton/core');
            const body = bc()
                .storeUint(PUBLIC_MINT_OPCODE, 32)
                .storeAddress(ownerAddress)
                .storeStringRefTail(endpoint)
                .storeStringRefTail(capabilities)
                .storeStringRefTail(metadata)
                .endCell();

            const payload = body.toBoc().toString('base64');

            // 0.05 fee + 0.06 gas + small buffer
            const amount = '120000000'; // 0.12 TON

            res.json({
                success: true,
                payload,
                address: config.registryAddress,
                amount,
                message: 'Sign this transaction in your wallet',
            });
        } catch (error: any) {
            console.error('Public mint payload error:', error);
            res.status(500).json({ error: 'Failed to build payload' });
        }
    });

    // Rate limiter for reputation endpoint (5 req/sec per IP)
    const reputationRateMap = new Map<string, number[]>();
    setInterval(() => {
        const now = Date.now();
        for (const [ip, timestamps] of reputationRateMap) {
            const valid = timestamps.filter(t => now - t < 1000);
            if (valid.length === 0) reputationRateMap.delete(ip);
            else reputationRateMap.set(ip, valid);
        }
    }, 60_000);
    function checkReputationRate(ip: string): boolean {
        const now = Date.now();
        const window = 1000; // 1 second
        const max = 5;
        const timestamps = (reputationRateMap.get(ip) || []).filter(t => now - t < window);
        if (timestamps.length >= max) return false;
        timestamps.push(now);
        reputationRateMap.set(ip, timestamps);
        return true;
    }

    // Reputation endpoint
    app.get('/api/reputation/:address', async (req, res) => {
        try {
            const { address } = req.params;

            // Rate limit
            const ip = req.ip || 'unknown';
            if (!checkReputationRate(ip)) {
                res.status(429).json({ error: 'Too many requests' });
                return;
            }

            // Validate address
            try {
                Address.parse(address);
            } catch {
                res.status(400).json({ error: 'Invalid TON address' });
                return;
            }

            const sdk = getSDK();

            // Try as passport address first, then as owner
            let passportData;
            try {
                passportData = await sdk.getPassport(address);
            } catch {
                // Try as owner address
                try {
                    const passports = await sdk.getPassportsByOwner(address);
                    if (passports.length > 0) {
                        passportData = passports[0];
                    }
                } catch {
                    // no passport found
                }
            }

            if (!passportData) {
                res.json({
                    found: false,
                    score: 0,
                    level: 'none',
                    breakdown: { existence: 0, activity: 0, age: 0, capabilities: 0 },
                    message: 'No passport found for this address',
                });
                return;
            }

            const score = calculateTrustScore({
                owner: passportData.ownerAddress,
                endpoint: passportData.endpoint,
                capabilities: passportData.capabilities,
                txCount: passportData.txCount,
                createdAt: passportData.createdAt,
                revokedAt: passportData.revokedAt,
            });

            res.json({
                found: true,
                address: passportData.address,
                score: score.total,
                level: score.level,
                breakdown: score.breakdown,
                passport: {
                    owner: passportData.ownerAddress,
                    endpoint: passportData.endpoint,
                    capabilities: passportData.capabilities,
                    txCount: passportData.txCount,
                    createdAt: passportData.createdAt,
                    revokedAt: passportData.revokedAt,
                    isActive: passportData.isActive,
                },
            });
        } catch (error: any) {
            console.error('Reputation error:', error);
            res.status(500).json({ error: 'Failed to fetch reputation' });
        }
    });

    const API_PORT = 3001;
    app.listen(API_PORT, '127.0.0.1', () => {
        console.log(`Mint API running on http://127.0.0.1:${API_PORT}`);
    });

    return app;
}
