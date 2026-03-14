import { useState, useCallback } from 'react';

export interface Reputation {
  found: boolean;
  score: number;
  level: string;
  breakdown: {
    existence: number;
    activity: number;
    age: number;
    capabilities: number;
  };
  passport?: {
    owner: string;
    endpoint: string;
    capabilities: string;
    txCount: number;
    createdAt: number;
    revokedAt: number;
    isActive: boolean;
  };
}

export function useReputation() {
  const [loading, setLoading] = useState(false);
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReputation = useCallback(async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reputation/${encodeURIComponent(address)}`);
      const data = await res.json();
      if (res.ok) {
        setReputation(data);
      } else {
        setError(data.error || 'Failed to fetch');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { reputation, loading, error, fetchReputation };
}
