---
name: tonapi
description: >
  Reference for tonapi.io — the REST API for reading on-chain data from the TON blockchain.
  Covers querying accounts, NFTs/SBTs, transactions, jettons, DNS, events, and traces.
  Use this skill whenever the user needs to read data from the TON blockchain via API —
  check SBT ownership, fetch NFT metadata, look up transactions, get account info,
  verify wallet balances, query jetton transfers, or integrate on-chain data into a
  backend or Telegram bot. Also trigger for any code that imports tonapi-sdk-js or
  calls api.tonapi.io endpoints.
---

# tonapi.io — TON Blockchain REST API

## Overview

tonapi.io provides a comprehensive REST API for reading TON blockchain data.
It indexes the entire blockchain and provides fast, structured access to accounts,
NFTs, SBTs, jettons, transactions, events, DNS, and more.

**Base URL:** `https://tonapi.io/v2`
**Docs:** https://docs.tonapi.io/
**Swagger:** https://tonapi.io/v2/api-doc
**SDK:** `tonapi-sdk-js` (npm)

## Authentication

Free tier: limited rate. For production, get an API key:

```
Header: Authorization: Bearer <YOUR_API_KEY>
```

Get keys at: https://tonconsole.com/

## JavaScript/TypeScript SDK

```bash
npm install tonapi-sdk-js
```

### Setup

```typescript
import { Api, HttpClient } from "tonapi-sdk-js";

const httpClient = new HttpClient({
    baseUrl: "https://tonapi.io",
    baseApiParams: {
        headers: {
            Authorization: `Bearer ${process.env.TONAPI_KEY}`,
            "Content-Type": "application/json",
        },
    },
});

const tonapi = new Api(httpClient);
```

## Key Endpoints

### Accounts

```typescript
// Get account info
const account = await tonapi.accounts.getAccount(address);
// Returns: { address, balance, status, name, icon, ... }

// Get account balance
account.balance  // in nanotons (bigint string)

// Parse address formats
const info = await tonapi.accounts.addressParse(rawAddress);
// Returns: { raw_form, bounceable, non_bounceable }
```

### NFT / SBT Items

```typescript
// Get single NFT/SBT item
const nft = await tonapi.nft.getNftItemByAddress(itemAddress);
// Returns:
// {
//   address: string,
//   index: number,
//   collection: { address, name, description },
//   owner: { address, name, ... },
//   metadata: { name, description, image, attributes: [...] },
//   verified: boolean,
//   trust: "whitelist" | "graylist" | "blacklist" | "none",
//   approved_by: string[],
// }

// Check if it's an SBT (non-transferable)
// SBTs are returned as NFTs but metadata/collection will indicate SBT type

// Get all NFTs/SBTs owned by an account
const nfts = await tonapi.accounts.getAccountNftItems(ownerAddress, {
    collection: collectionAddress,  // optional: filter by collection
    limit: 100,
    offset: 0,
});
// Returns: { nft_items: NftItem[] }

// Check SBT ownership for a specific user and collection
async function hasSbt(ownerAddress: string, collectionAddress: string): Promise<boolean> {
    const result = await tonapi.accounts.getAccountNftItems(ownerAddress, {
        collection: collectionAddress,
        limit: 1,
    });
    return result.nft_items.length > 0;
}

// Get items in a collection
const items = await tonapi.nft.getItemsFromCollection(collectionAddress, {
    limit: 100,
    offset: 0,
});
// Returns: { nft_items: NftItem[] }
```

### NFT Collections

```typescript
// Get collection info
const collection = await tonapi.nft.getNftCollection(collectionAddress);
// Returns:
// {
//   address: string,
//   next_item_index: number,
//   owner: { address },
//   raw_collection_content: string,
//   metadata: { name, description, image },
// }
```

### Transactions & Events

```typescript
// Get account transactions
const txs = await tonapi.accounts.getAccountTransactions(address, {
    limit: 20,
});
// Returns: { transactions: Transaction[] }

// Get account events (higher-level, parsed actions)
const events = await tonapi.accounts.getAccountEvents(address, {
    limit: 20,
});
// Returns: { events: AccountEvent[] }
// Each event has: actions[], timestamp, event_id, etc.
// Actions include: TonTransfer, JettonTransfer, NftItemTransfer, SmartContractExec, etc.

// Get specific transaction
const tx = await tonapi.blockchain.getBlockchainTransaction(txHash);

// Trace a transaction (follow message chain)
const trace = await tonapi.traces.getTrace(traceId);
```

### Jettons (Fungible Tokens)

```typescript
// Get jetton metadata
const jetton = await tonapi.jettons.getJettonInfo(jettonMasterAddress);
// Returns: { metadata: { name, symbol, decimals, image }, total_supply, ... }

// Get jetton balances for an account
const balances = await tonapi.accounts.getAccountJettonsBalances(ownerAddress);
// Returns: { balances: [ { jetton: {...}, balance: string, wallet_address: {...} } ] }

// Get jetton transfer history
const history = await tonapi.accounts.getAccountJettonHistoryByID(
    ownerAddress,
    jettonMasterAddress,
    { limit: 50 }
);
```

### Blockchain Methods

```typescript
// Execute get method on a contract
const result = await tonapi.blockchain.execGetMethodForBlockchainAccount(
    contractAddress,
    methodName,
    { args: ["arg1", "arg2"] }  // optional args as strings
);
// Returns: { success: boolean, stack: TvmStackRecord[], decoded: any }

// Example: read SBT revoked_time
const revokeResult = await tonapi.blockchain.execGetMethodForBlockchainAccount(
    sbtItemAddress,
    "get_revoked_time"
);
const revokedTime = revokeResult.decoded; // 0 if not revoked

// Example: read SBT authority
const authResult = await tonapi.blockchain.execGetMethodForBlockchainAccount(
    sbtItemAddress,
    "get_authority_address"
);
```

### DNS

```typescript
// Resolve TON DNS name
const dns = await tonapi.dns.dnsResolve(domainName);
// Returns: { wallet: { address, ... }, ... }
```

### Wallet

```typescript
// Get wallet seqno (useful before sending)
const seqno = await tonapi.wallet.getAccountSeqno(walletAddress);
```

## REST API Reference (curl examples)

### Account Info
```
GET /v2/accounts/{account_id}
```

### NFTs by Owner
```
GET /v2/accounts/{account_id}/nfts?collection={collection_address}&limit=100
```

### SBT Verification (check ownership)
```bash
curl "https://tonapi.io/v2/accounts/${OWNER}/nfts?collection=${COLLECTION}&limit=1" \
  -H "Authorization: Bearer ${TONAPI_KEY}"
# If nft_items array is non-empty → user owns an SBT from this collection
```

### Collection Items
```
GET /v2/nfts/collections/{account_id}/items?limit=100&offset=0
```

### Execute Get Method
```
GET /v2/blockchain/accounts/{account_id}/methods/{method_name}?args=arg1&args=arg2
```

### Account Events
```
GET /v2/accounts/{account_id}/events?limit=20
```

### Account Transactions
```
GET /v2/accounts/{account_id}/transactions?limit=20
```

## Common Patterns

### SBT Ownership Check (for Telegram Bot)

```typescript
import { Api, HttpClient } from "tonapi-sdk-js";

const SBT_COLLECTION = "EQ...your_collection_address";

async function checkSbtOwnership(walletAddress: string): Promise<{
    hasSbt: boolean;
    sbtItem?: any;
}> {
    try {
        const result = await tonapi.accounts.getAccountNftItems(walletAddress, {
            collection: SBT_COLLECTION,
            limit: 1,
        });

        if (result.nft_items.length > 0) {
            const sbt = result.nft_items[0];
            // Optionally check if revoked
            const revokeCheck = await tonapi.blockchain.execGetMethodForBlockchainAccount(
                sbt.address,
                "get_revoked_time"
            );
            const revokedTime = parseInt(revokeCheck.decoded || "0");

            return {
                hasSbt: revokedTime === 0,
                sbtItem: sbt,
            };
        }

        return { hasSbt: false };
    } catch (err) {
        console.error("SBT check failed:", err);
        return { hasSbt: false };
    }
}
```

### Watch for New SBT Mints (Polling)

```typescript
async function pollNewMints(collectionAddress: string, sinceTimestamp: number) {
    const events = await tonapi.accounts.getAccountEvents(collectionAddress, {
        limit: 50,
    });

    const mints = events.events
        .filter(e => e.timestamp > sinceTimestamp)
        .flatMap(e => e.actions)
        .filter(a => a.type === "NftItemTransfer" && a.NftItemTransfer?.sender === null);

    return mints.map(m => ({
        nftAddress: m.NftItemTransfer?.nft,
        newOwner: m.NftItemTransfer?.recipient?.address,
    }));
}
```

### Get Full SBT Metadata

```typescript
async function getSbtMetadata(sbtItemAddress: string) {
    const nft = await tonapi.nft.getNftItemByAddress(sbtItemAddress);
    return {
        name: nft.metadata?.name,
        description: nft.metadata?.description,
        image: nft.metadata?.image,
        attributes: nft.metadata?.attributes || [],
        owner: nft.owner?.address,
        collection: nft.collection?.address,
        collectionName: nft.collection?.name,
    };
}
```

## Rate Limits

| Tier | Requests/sec | Notes |
|------|-------------|-------|
| Free | ~1 req/s | No API key needed, strict limits |
| Paid | 10-100+ req/s | Key via tonconsole.com |

Tips:
- Cache NFT metadata (it rarely changes)
- Batch requests where possible
- Use webhooks (tonapi streaming) for real-time data instead of polling

## Streaming API (SSE)

tonapi provides Server-Sent Events for real-time data:

```typescript
const eventSource = new EventSource(
    `https://tonapi.io/v2/sse/accounts/transactions?accounts=${address}`,
    {
        headers: { Authorization: `Bearer ${TONAPI_KEY}` },
    }
);

eventSource.onmessage = (event) => {
    const tx = JSON.parse(event.data);
    console.log("New transaction:", tx);
};
```

Available SSE streams:
- `/v2/sse/accounts/transactions?accounts=addr1,addr2` — transactions for specific accounts
- `/v2/sse/mempool` — pending transactions (mempool)
