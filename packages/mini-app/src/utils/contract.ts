import { beginCell, Address, toNano, Cell } from '@ton/core';

export const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS;
// TONAPI key removed from client — proxied through nginx
export const NETWORK = import.meta.env.VITE_NETWORK || 'testnet';
export const TONCONNECT_MANIFEST_URL = import.meta.env.VITE_TONCONNECT_MANIFEST_URL;

export const TONAPI_BASE_URL =
  '/tonapi';  // Proxied through nginx

export const TONSCAN_BASE_URL =
  NETWORK === 'mainnet' ? 'https://tonscan.org' : 'https://testnet.tonscan.org';

const MINT_PASSPORT_OPCODE = 3867318038;

export interface MintParams {
  owner: Address;
  capabilities: string;
  endpoint: string;
  metadataUrl: string;
}

export function buildMintBody(params: MintParams): Cell {
  return beginCell()
    .storeUint(MINT_PASSPORT_OPCODE, 32)
    .storeUint(BigInt(Date.now()), 64)
    .storeAddress(params.owner)
    .storeStringRefTail(params.capabilities)
    .storeStringRefTail(params.endpoint)
    .storeStringRefTail(params.metadataUrl)
    .endCell();
}

export function buildMintTransaction(mintBody: Cell) {
  return {
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: REGISTRY_ADDRESS,
        amount: toNano('0.2').toString(),
        payload: mintBody.toBoc().toString('base64'),
      },
    ],
  };
}
