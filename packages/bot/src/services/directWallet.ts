import { WalletContractV4, internal, TonClient, SendMode } from '@ton/ton';
import { mnemonicToPrivateKey, KeyPair } from '@ton/crypto';
import { Cell } from '@ton/core';

let client: TonClient;
let wallet: WalletContractV4;
let keyPair: KeyPair;
let initialized = false;

export async function initDirectWallet() {
    const mnemonic = process.env.MNEMONIC;
    if (!mnemonic) {
        throw new Error('MNEMONIC not set in .env');
    }

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 24) {
        throw new Error(`MNEMONIC must be 24 words, got ${words.length}`);
    }

    keyPair = await mnemonicToPrivateKey(words);

    wallet = WalletContractV4.create({
        publicKey: keyPair.publicKey,
        workchain: 0,
    });

    const isTestnet = process.env.NETWORK === 'testnet';
    const endpoint = isTestnet
        ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
        : 'https://toncenter.com/api/v2/jsonRPC';

    client = new TonClient({
        endpoint,
        apiKey: process.env.TONCENTER_API_KEY || undefined,
    });
    initialized = true;

    console.log(`Direct wallet initialized: ${wallet.address.toString({ testOnly: isTestnet })}`);
}

export function getWalletAddress(): string {
    if (!initialized) throw new Error('Wallet not initialized');
    return wallet.address.toString({ testOnly: process.env.NETWORK === 'testnet' });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 3000): Promise<T> {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err: any) {
            const is429 = err?.response?.status === 429 || err?.status === 429 ||
                (err?.message && err.message.includes('429'));
            if (is429 && i < retries - 1) {
                console.log(`Rate limited, retrying in ${delay / 1000}s... (${i + 1}/${retries})`);
                await new Promise(r => setTimeout(r, delay));
                delay *= 2;
                continue;
            }
            throw err;
        }
    }
    throw new Error('Max retries exceeded');
}

export async function sendTransaction(params: {
    to: string;
    value: bigint;
    body: Cell;
}): Promise<string> {
    if (!initialized) throw new Error('Wallet not initialized');

    const contract = client.open(wallet);
    const seqno = await withRetry(() => contract.getSeqno());

    await withRetry(() => contract.sendTransfer({
        secretKey: keyPair.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: params.to,
                value: params.value,
                body: params.body,
                bounce: false,
            }),
        ],
    }));

    return `seqno:${seqno}`;
}

export function isInitialized(): boolean {
    return initialized;
}
