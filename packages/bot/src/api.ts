import express from 'express';
import cors from 'cors';
import { Address } from '@ton/core';
import { config } from './config';
import { getTonConnect } from './services/wallet';
import { buildMintBody, sendMintTransaction } from './services/mint';
import { checkMintRateLimit } from './middleware/rateLimit';

// Admin chat ID — set when admin connects via /connect
let adminChatId: number | null = null;

export function setAdminChatId(chatId: number) {
    adminChatId = chatId;
    console.log(`Admin chat ID set to ${chatId}`);
}

export function getAdminChatId(): number | null {
    return adminChatId;
}

export function createApiServer() {
    const app = express();

    app.use(cors({
        origin: '*', // Allow all origins for hackathon demo
    }));
    app.use(express.json());

    // Health check
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', adminConnected: adminChatId !== null });
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

            // Rate limiting
            const identifier = req.ip || 'unknown';
            if (!checkMintRateLimit(identifier)) {
                res.status(429).json({ error: 'Please wait 60 seconds between mints' });
                return;
            }

            // Check admin TonConnect session
            if (!adminChatId) {
                res.status(503).json({ error: 'Admin wallet not connected. Ask admin to /connect in bot.' });
                return;
            }

            const tc = getTonConnect(adminChatId);
            if (!tc.connected) {
                res.status(503).json({ error: 'Admin wallet disconnected. Ask admin to reconnect.' });
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

            const boc = await sendMintTransaction(tc, config.registryAddress, mintBody);

            res.json({
                success: true,
                txHash: boc || 'pending',
                message: 'Passport minted successfully',
            });
        } catch (error: any) {
            console.error('Auto-mint error:', error);
            res.status(500).json({
                error: 'Mint failed',
                details: error.message,
            });
        }
    });

    const API_PORT = 3001;
    app.listen(API_PORT, '127.0.0.1', () => {
        console.log(`Mint API running on http://127.0.0.1:${API_PORT}`);
    });

    return app;
}
