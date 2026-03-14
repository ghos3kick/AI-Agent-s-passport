import { TONAPI_BASE_URL, REGISTRY_ADDRESS } from '../utils/contract';

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

async function apiFetch(path: string) {
  const res = await fetch(`${TONAPI_BASE_URL}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`TONAPI error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function parseStackValue(record: { type: string; num?: string; cell?: string; slice?: string }): string {
  if (record.type === 'slice' && record.slice) return record.slice;
  if (record.type === 'cell' && record.cell) return record.cell;
  if (record.type === 'num' && record.num) return record.num;
  return '';
}

export interface PassportData {
  address: string;
  index: number;
  ownerAddress: string;
  collectionAddress: string;
  capabilities: string;
  endpoint: string;
  metadataUrl: string;
  txCount: number;
  createdAt: number;
  revokedAt: number;
  isActive: boolean;
}

export async function getPassportsByOwner(ownerAddress: string): Promise<PassportData[]> {
  const data = await apiFetch(
    `/v2/accounts/${encodeURIComponent(ownerAddress)}/nfts?collection=${encodeURIComponent(REGISTRY_ADDRESS)}&limit=100`
  );

  const passports: PassportData[] = [];
  for (const item of data.nft_items || []) {
    try {
      const passport = await getPassportByAddress(item.address);
      passports.push(passport);
    } catch {
      // skip items that fail to parse
    }
  }
  return passports;
}

export async function getPassportByAddress(passportAddress: string): Promise<PassportData> {
  // Get NFT item data
  const nftItem = await apiFetch(`/v2/nfts/${encodeURIComponent(passportAddress)}`);

  // Get custom passport data
  const passportResult = await apiFetch(
    `/v2/blockchain/accounts/${encodeURIComponent(passportAddress)}/methods/get_passport_data`
  );

  let capabilities = '';
  let endpoint = '';
  let metadataUrl = '';
  let createdAt = 0;
  let txCount = 0;
  let revokedAt = 0;
  let ownerAddress = nftItem.owner?.address ?? '';

  const decoded = passportResult.decoded;
  if (decoded && typeof decoded === 'object') {
    capabilities = decoded.capabilities ?? '';
    endpoint = decoded.endpoint ?? '';
    metadataUrl = decoded.metadataUrl ?? decoded.metadata_url ?? '';
    createdAt = Number(decoded.createdAt ?? decoded.created_at ?? 0);
    txCount = Number(decoded.txCount ?? decoded.tx_count ?? 0);
    revokedAt = Number(decoded.revokedAt ?? decoded.revoked_at ?? 0);
    if (decoded.owner) ownerAddress = decoded.owner;
  } else if (passportResult.stack?.length >= 7) {
    const stack = passportResult.stack;
    ownerAddress = parseStackValue(stack[0]) || ownerAddress;
    capabilities = parseStackValue(stack[1]);
    endpoint = parseStackValue(stack[2]);
    metadataUrl = parseStackValue(stack[3]);
    createdAt = Number(stack[4]?.num ?? '0');
    txCount = Number(stack[5]?.num ?? '0');
    revokedAt = Number(stack[6]?.num ?? '0');
  }


  // Verify SBT is from official registry
  if (nftItem.collection?.address !== REGISTRY_ADDRESS) {
    throw new Error("SBT not from official registry");
  }
  return {
    address: passportAddress,
    index: nftItem.index ?? 0,
    ownerAddress,
    collectionAddress: nftItem.collection?.address ?? '',
    capabilities,
    endpoint,
    metadataUrl,
    txCount,
    createdAt,
    revokedAt,
    isActive: revokedAt === 0,
  };
}

export async function getRegistryInfo() {
  const result = await apiFetch(
    `/v2/blockchain/accounts/${encodeURIComponent(REGISTRY_ADDRESS)}/methods/get_collection_data`
  );

  const stack = result.stack;
  return {
    nextItemIndex: Number(stack[0]?.num ?? '0'),
  };
}

export async function verifyPassport(address: string): Promise<{
  exists: boolean;
  isActive: boolean;
  ownerAddress: string;
  passport?: PassportData;
}> {
  // Try as passport address first
  try {
    const passport = await getPassportByAddress(address);
    return {
      exists: true,
      isActive: passport.isActive,
      ownerAddress: passport.ownerAddress,
      passport,
    };
  } catch {
    // Not a passport address, try as owner
  }

  // Try as owner address
  try {
    const passports = await getPassportsByOwner(address);
    if (passports.length > 0) {
      const p = passports[0];
      return {
        exists: true,
        isActive: p.isActive,
        ownerAddress: p.ownerAddress,
        passport: p,
      };
    }
  } catch {
    // no passports found
  }

  return { exists: false, isActive: false, ownerAddress: '' };
}

export async function checkHasPassport(ownerAddress: string): Promise<boolean> {
  try {
    const data = await apiFetch(
      `/v2/accounts/${encodeURIComponent(ownerAddress)}/nfts?collection=${encodeURIComponent(REGISTRY_ADDRESS)}&limit=1`
    );
    return (data.nft_items?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
