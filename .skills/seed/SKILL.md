---
name: seed
description: Seed the Agent Passport registry with demo data. Use when the user wants to populate the registry with test passports, run demo seed, add sample data, or prepare the project for a demo/presentation. Also triggers for "mint test passports", "fill with demo data", "prepare for demo".
---

# Demo Seed — Agent Passport

## Pre-flight

1. Verify bot API is running:
```bash
curl -s http://localhost:3001/api/health
```

2. Verify direct wallet is initialized:
```bash
pm2 logs agent-passport-bot --lines 5 --nostream | grep "wallet\|initialized"
```

3. Check current passport count:
```bash
REGISTRY=$(grep REGISTRY_ADDRESS /opt/agent-passport/packages/bot/.env | cut -d= -f2)
curl -s "http://194.87.31.34/tonapi/v2/blockchain/accounts/$REGISTRY/methods/get_collection_data"
```

## Run seed

```bash
cd /opt/agent-passport
npx tsx scripts/demo-seed.ts
```

The script mints 5 AI agent passports:
1. Atlas AI — reasoning, code generation
2. Nexus Trading Bot — DeFi trading
3. Sentinel Guard — security audit
4. DataStream Oracle — data aggregation
5. Muse Creative AI — generative art

Each mint has a 15-second delay (rate limit).

## Verify

After seed completes:
```bash
REGISTRY=$(grep REGISTRY_ADDRESS /opt/agent-passport/packages/bot/.env | cut -d= -f2)

# Count passports
curl -s "http://194.87.31.34/tonapi/v2/blockchain/accounts/$REGISTRY/methods/get_collection_data"

# Test API health
curl -s http://194.87.31.34/api/health
```

Open Mini App -> Home should show updated passport count.

## Custom seed

To mint a custom passport via API:
```bash
curl -s -X POST http://localhost:3001/api/mint \
  -H "Content-Type: application/json" \
  -d '{
    "owner": "<TON_ADDRESS>",
    "endpoint": "https://api.example.com",
    "capabilities": "chat,analysis",
    "metadata": "https://example.com/metadata.json"
  }'
```

## Demo metadata

Metadata JSON files are served from `docs/demo/`.
