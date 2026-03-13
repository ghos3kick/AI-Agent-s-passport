'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { TONCONNECT_MANIFEST_URL } from '@/lib/constants';

export function TonConnectProvider({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl={TONCONNECT_MANIFEST_URL}>
      {children}
    </TonConnectUIProvider>
  );
}
