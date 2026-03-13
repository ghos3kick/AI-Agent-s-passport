import TonConnect from '@tonconnect/sdk';
import { config } from '../config';

// In-memory storage for TonConnect sessions (MVP)
const sessions = new Map<number, TonConnect>();

class InMemoryStorage {
    private data = new Map<string, string>();
    async getItem(key: string): Promise<string | null> {
        return this.data.get(key) ?? null;
    }
    async setItem(key: string, value: string): Promise<void> {
        this.data.set(key, value);
    }
    async removeItem(key: string): Promise<void> {
        this.data.delete(key);
    }
}

export function getTonConnect(chatId: number): TonConnect {
    let tc = sessions.get(chatId);
    if (!tc) {
        tc = new TonConnect({
            manifestUrl: config.tonconnectManifestUrl,
            storage: new InMemoryStorage(),
        });
        sessions.set(chatId, tc);
    }
    return tc;
}

export function removeTonConnect(chatId: number): void {
    const tc = sessions.get(chatId);
    if (tc) {
        tc.disconnect();
        sessions.delete(chatId);
    }
}
