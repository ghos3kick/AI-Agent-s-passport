'use client';

import { useMemo } from 'react';
import { AgentPassportSDK } from '@agent-passport/sdk';
import { REGISTRY_ADDRESS, TONAPI_KEY, NETWORK } from '@/lib/constants';

export function useSDK(): AgentPassportSDK {
  return useMemo(
    () =>
      new AgentPassportSDK({
        registryAddress: REGISTRY_ADDRESS,
        tonapiKey: TONAPI_KEY,
        network: NETWORK,
      }),
    [],
  );
}
