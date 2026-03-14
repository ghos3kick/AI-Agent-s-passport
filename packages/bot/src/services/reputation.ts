export interface PassportInput {
    owner: string;
    endpoint: string;
    capabilities: string;
    txCount: number;
    createdAt: number;
    revokedAt: number;
}

export interface TrustScore {
    total: number;
    level: string;
    breakdown: {
        existence: number;
        activity: number;
        age: number;
        capabilities: number;
    };
}

export function calculateTrustScore(data: PassportInput): TrustScore {
    if (data.revokedAt > 0) {
        return {
            total: 0,
            level: 'revoked',
            breakdown: { existence: 0, activity: 0, age: 0, capabilities: 0 },
        };
    }

    const existence = 20;

    const activity = Math.min(40, (data.txCount || 0) * 4);

    let age = 5; // default if no creation date
    if (data.createdAt > 0) {
        const daysSinceCreation = Math.floor((Date.now() / 1000 - data.createdAt) / 86400);
        age = Math.min(20, Math.max(0, daysSinceCreation));
    }

    const capCount = data.capabilities
        ? data.capabilities.split(',').filter(c => c.trim()).length
        : 0;
    const capabilities = Math.min(20, capCount * 5);

    const total = Math.min(100, existence + activity + age + capabilities);

    let level: string;
    if (total >= 80) level = 'elite';
    else if (total >= 60) level = 'verified';
    else if (total >= 40) level = 'trusted';
    else if (total > 0) level = 'new';
    else level = 'none';

    return {
        total,
        level,
        breakdown: { existence, activity, age, capabilities },
    };
}
