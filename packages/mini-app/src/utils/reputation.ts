import type { PassportData } from '../hooks/useTonApi';

const levelColors: Record<string, string> = {
  elite: '#10b981',
  verified: '#3b82f6',
  trusted: '#8b5cf6',
  new: '#f59e0b',
  none: '#475569',
  revoked: '#ef4444',
};

export function calculateTrustScoreLocal(data: PassportData) {
  if (data.revokedAt > 0) {
    return { total: 0, level: 'revoked', color: levelColors.revoked, breakdown: { existence: 0, activity: 0, age: 0, capabilities: 0 } };
  }

  const existence = 20;
  const activity = Math.min(40, (data.txCount || 0) * 4);

  let age = 5;
  if (data.createdAt > 0) {
    const days = Math.floor((Date.now() / 1000 - data.createdAt) / 86400);
    age = Math.min(20, Math.max(0, days));
  }

  const capCount = data.capabilities ? data.capabilities.split(',').filter(c => c.trim()).length : 0;
  const capabilities = Math.min(20, capCount * 5);
  const total = Math.min(100, existence + activity + age + capabilities);

  let level: string;
  if (total >= 80) level = 'elite';
  else if (total >= 60) level = 'verified';
  else if (total >= 40) level = 'trusted';
  else if (total > 0) level = 'new';
  else level = 'none';

  return { total, level, color: levelColors[level] || levelColors.none, breakdown: { existence, activity, age, capabilities } };
}
