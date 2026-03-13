'use client';

import { useQuery } from '@tanstack/react-query';
import { useSDK } from './useSDK';
import type { RegistryInfo } from '@agent-passport/sdk';

export function useRegistryStats() {
  const sdk = useSDK();
  return useQuery<RegistryInfo>({
    queryKey: ['registry-stats'],
    queryFn: () => sdk.getRegistryInfo(),
    staleTime: 30_000,
  });
}
