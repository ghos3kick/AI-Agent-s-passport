export const REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? 'EQplaceholder000000000000000000000000000000000000000';
export const TONAPI_BASE_URL = '/api/tonapi';
export const NETWORK = (process.env.NEXT_PUBLIC_NETWORK ?? 'testnet') as 'mainnet' | 'testnet';
export const TONCONNECT_MANIFEST_URL =
  process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL ??
  'https://agent-passport.example.com/tonconnect-manifest.json';
export const EXPLORER_BASE =
  NETWORK === 'testnet' ? 'https://testnet.tonviewer.com' : 'https://tonviewer.com';
