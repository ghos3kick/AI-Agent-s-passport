const mintCooldowns = new Map<string, number>();
const COOLDOWN_MS = 60_000; // 1 minute between mints

export function checkMintRateLimit(identifier: string): boolean {
    const lastMint = mintCooldowns.get(identifier);
    if (lastMint && Date.now() - lastMint < COOLDOWN_MS) {
        return false;
    }
    mintCooldowns.set(identifier, Date.now());
    return true;
}
