# Trust Score System

## Overview

Every Agent Passport has a Trust Score (0-100) reflecting the agent's on-chain reputation. The score is computed from blockchain data only — no off-chain oracles or manual ratings.

## Formula

```
Trust Score = min(100, existence + activity + age + capabilities)
```

### Components

| Component | Max Points | How Calculated |
|-----------|-----------|----------------|
| Existence | 20 | Flat 20 points if passport exists and is not revoked |
| Activity | 40 | `min(40, txCount * 4)` — 10+ transactions = max |
| Age | 20 | `min(20, daysSinceCreation)` — 20+ days = max |
| Capabilities | 20 | `min(20, capabilityCount * 5)` — 4+ capabilities = max |

### Scoring Details

**Existence (20 pts)**
- Passport exists and `revokedAt == 0` → 20 points
- Passport revoked → 0 points, entire score is 0, level is "revoked"
- No passport found → 0 points, level is "none"

**Activity (max 40 pts)**
- Each recorded transaction adds 4 points
- Transactions are incremented by the Registry authority via `IncrementTxCount`
- Capped at 40 (10+ transactions reach the cap)

**Age (max 20 pts)**
- 1 point per day since passport creation
- Uses `createdAt` timestamp from on-chain data
- Defaults to 5 points if creation date is unavailable
- Capped at 20 (20+ days reach the cap)

**Capabilities (max 20 pts)**
- 5 points per declared capability
- Capabilities are comma-separated in the passport data
- Capped at 20 (4+ capabilities reach the cap)

## Levels

| Level | Score Range | Description |
|-------|------------|-------------|
| Elite | 80-100 | Highly active, mature agent with diverse capabilities |
| Verified | 60-79 | Established agent with proven track record |
| Trusted | 40-59 | Active agent building reputation |
| New | 1-39 | Recently created, limited history |
| None | 0 | No passport found |
| Revoked | 0 | Passport has been revoked by authority |

## Examples

### New Agent (Score: 25)

An agent just minted with one capability, no transactions yet:

```
Existence:    20  (passport exists)
Activity:      0  (0 transactions * 4)
Age:           0  (just created)
Capabilities:  5  (1 capability * 5)
─────────────────
Total:        25  → Level: New
```

### Active Agent (Score: 57)

An agent with 5 transactions, 7 days old, 2 capabilities:

```
Existence:    20  (passport exists)
Activity:     20  (5 transactions * 4)
Age:           7  (7 days)
Capabilities: 10  (2 capabilities * 5)
─────────────────
Total:        57  → Level: Trusted
```

### Established Agent (Score: 80)

An agent with 10+ transactions, 20+ days old, 4+ capabilities:

```
Existence:    20  (passport exists)
Activity:     40  (10+ transactions, capped)
Age:          20  (20+ days, capped)
Capabilities: 20  (4+ capabilities, capped)
─────────────────
Total:       100  → Level: Elite
```

### Revoked Agent (Score: 0)

```
Passport revoked → score = 0, level = "revoked"
```

## API

```
GET /api/reputation/:address
```

Returns score, level, breakdown, and passport data. See [API Documentation](API.md) for details.

## Implementation

The trust score formula is implemented in two places:

1. **Server-side** — `packages/bot/src/services/reputation.ts` — authoritative computation
2. **Client-side** — `packages/mini-app/src/utils/reputation.ts` — instant preview

Both implementations use the same formula to ensure consistent results.
