# Agent Passport API

REST API for integrating with the Agent Passport system.

**Base URL:** `http://194.87.31.34/api`

## Authentication

Read endpoints require no authentication.
Admin endpoints require `x-admin-api-key` header.

---

## Endpoints

### Health Check

```
GET /api/health
```

**Response:**

```json
{
  "status": "ok",
  "walletReady": true
}
```

---

### Mint Passport (Admin)

```
POST /api/mint
```

Mint a new Agent Passport. The bot signs the transaction using the Registry owner wallet.

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| x-admin-api-key | no | Admin key — bypasses rate limit |

**Request Body:**

```json
{
  "owner": "EQD...",
  "endpoint": "https://api.myagent.ai/v1",
  "capabilities": "chat,reasoning,code-generation",
  "metadata": "https://example.com/agent-metadata.json"
}
```

**Fields:**

| Field | Type | Required | Max Length | Description |
|-------|------|----------|-----------|-------------|
| owner | string | yes | 100 | TON address of the passport owner |
| endpoint | string | yes | 256 | Agent API endpoint URL |
| capabilities | string | yes | 256 | Comma-separated list of capabilities |
| metadata | string | yes | 256 | URL to TEP-64 JSON metadata file |

**Response (success):**

```json
{
  "success": true,
  "txHash": "seqno:42",
  "message": "Passport minted successfully"
}
```

**Response (error):**

```json
{
  "error": "Invalid TON address"
}
```

**Gas cost:** ~0.2 TON per mint (paid by bot wallet).

**Rate limit:** 1 request per 60 seconds per IP (bypassed with admin API key).

---

### Public Mint Payload

```
POST /api/public-mint-payload
```

Returns a transaction payload for `PublicMintPassport`. The user signs the transaction in their own wallet via TON Connect.

**Request Body:** Same fields as `/api/mint`.

**Response:**

```json
{
  "success": true,
  "payload": "te6cck...",
  "address": "EQDRdykyEDAj9GgM3sPnkj9Y-OM6IG3wX_QmI40emh2HBxZS",
  "amount": "120000000",
  "message": "Sign this transaction in your wallet"
}
```

- `payload` — base64-encoded BOC with opcode `534822672` (PublicMintPassport)
- `address` — Registry contract address to send the transaction to
- `amount` — 0.12 TON in nanoTON (0.05 fee + 0.06 gas + 0.01 buffer)

---

### Agent Reputation

```
GET /api/reputation/:address
```

Returns trust score and reputation breakdown for a passport or owner address.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| address | string (path) | TON address — passport address or owner address |

The endpoint first tries direct passport lookup, then falls back to owner-based search.

**Response (found):**

```json
{
  "found": true,
  "address": "EQD...",
  "score": 65,
  "level": "verified",
  "breakdown": {
    "existence": 20,
    "activity": 20,
    "age": 5,
    "capabilities": 20
  },
  "passport": {
    "owner": "EQD...",
    "endpoint": "https://api.myagent.ai/v1",
    "capabilities": "chat,reasoning",
    "txCount": 5,
    "createdAt": 1710000000,
    "revokedAt": 0,
    "isActive": true
  }
}
```

**Response (not found):**

```json
{
  "found": false,
  "address": "EQD...",
  "score": 0,
  "level": "none",
  "breakdown": {
    "existence": 0,
    "activity": 0,
    "age": 0,
    "capabilities": 0
  }
}
```

**Score levels:**

| Level | Score Range | Description |
|-------|------------|-------------|
| elite | 80-100 | Highly active, mature agent |
| verified | 60-79 | Established agent |
| trusted | 40-59 | Active agent |
| new | 1-39 | Recently created |
| none | 0 | No passport found |
| revoked | 0 | Passport revoked |

**Rate limit:** 5 requests per second per IP.

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 400 | Invalid request (bad address, missing fields, field too long) |
| 429 | Rate limited |
| 500 | Server error (wallet not ready, transaction failed) |

## Rate Limits Summary

| Endpoint | Limit |
|----------|-------|
| `GET /api/health` | Unlimited |
| `POST /api/mint` | 1/min per IP |
| `POST /api/public-mint-payload` | Unlimited |
| `GET /api/reputation/:address` | 5/sec per IP |

## Examples

### cURL: Check health

```bash
curl -s http://194.87.31.34/api/health | python3 -m json.tool
```

### cURL: Get reputation

```bash
curl -s http://194.87.31.34/api/reputation/EQDRdykyEDAj9GgM3sPnkj9Y-OM6IG3wX_QmI40emh2HBxZS \
  | python3 -m json.tool
```

### cURL: Admin mint

```bash
curl -X POST http://194.87.31.34/api/mint \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: YOUR_KEY" \
  -d '{
    "owner": "EQD...",
    "endpoint": "https://api.myagent.ai/v1",
    "capabilities": "chat,reasoning",
    "metadata": "https://example.com/metadata.json"
  }'
```

### cURL: Get public mint payload

```bash
curl -X POST http://194.87.31.34/api/public-mint-payload \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "EQD...",
    "endpoint": "https://api.myagent.ai/v1",
    "capabilities": "chat,reasoning",
    "metadata": "https://example.com/metadata.json"
  }'
```
