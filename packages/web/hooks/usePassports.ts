'use client';

import { useQuery } from '@tanstack/react-query';
import { useSDK } from './useSDK';
import type { AgentPassportData } from '@agent-passport/sdk';

export function usePassports(limit = 12, offset = 0) {
  const sdk = useSDK();
  return useQuery<AgentPassportData[]>({
    queryKey: ['passports', limit, offset],
    queryFn: () => sdk.listPassports({ limit, offset }),
    staleTime: 30_000,
  });
}
