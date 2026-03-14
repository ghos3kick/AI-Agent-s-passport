# Architecture

## System Overview

```
                         TON Blockchain (Testnet)
                    ┌─────────────────────────────────┐
                    │                                 │
                    │  Agent Registry (TEP-62)        │
                    │  ├── Agent Passport #0 (SBT)   │
                    │  ├── Agent Passport #1 (SBT)   │
                    │  └── ...                        │
                    │                                 │
                    └──────────┬──────────────────────┘
                               │
                        tonapi.io (reads)
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────┴─────┐      ┌──────┴──────┐     ┌──────┴──────┐
    │   Bot     │      │  Mini App   │     │    Web      │
    │  grammY   │      │ Vite+React  │     │  Next.js    │
    │  Express  │◄─────│ TON Connect │     │  Dashboard  │
    │  :3001    │ API  │             │     │  :3000      │
    └─────┬─────┘      └─────────────┘     └─────────────┘
          │
    Direct Wallet
    (mnemonic signing)

    ┌─────────────────────────────────────────────┐
    │              nginx reverse proxy            │
    │  /api/*      → localhost:3001 (bot)         │
    │  /mini-app/* → static files (vite build)    │
    │  /tonapi/*   → tonapi.io (key injection)    │
    │  /*          → localhost:3000 (web)          │
    └─────────────────────────────────────────────┘
```

## Components

### Smart Contracts (Tact)

- **Agent Registry** — TEP-62 NFT Collection. Manages passport minting (admin + public), fee collection, and batch operations on passports (increment tx count, update capabilities).
- **Agent Passport** — TEP-85 SBT. Non-transferable identity token storing capabilities, endpoint, metadata URL, transaction counter, and revocation status.

See [CONTRACTS.md](CONTRACTS.md) for full contract documentation.

### SDK (`@agent-passport/sdk`)

TypeScript library wrapping TONAPI for reading on-chain data:
- Registry queries (total passports, passport address by index)
- Passport data reads (by address, by index, by owner)
- Ownership verification and passport existence checks
- Bulk listing and capability search

Used by bot, web dashboard, and can be used by third-party integrators.

### Telegram Bot (`@agent-passport/bot`)

grammY v1 bot with Express HTTP API server:
- **Commands:** `/start`, `/app`, `/mint`, `/lookup`, `/verify`, `/stats`, `/help`, `/connect`, `/disconnect`, `/mypassport`
- **REST API:** Health check, admin mint, public mint payload, reputation
- **Direct wallet:** Signs mint transactions using mnemonic from `.env`
- **Conversations:** Multi-step `/mint` flow using `@grammyjs/conversations` v2

### Mini App (Vite + React)

Telegram Mini App with 5 screens:
- **Home** — Live stats, quick action cards
- **Search** — Passport lookup by address
- **Mint** — Quick Mint (bot-signed) or Self Mint (TON Connect)
- **Verify** — Passport verification with trust score
- **Help** — Product overview overlay

Uses `@tonconnect/ui-react` for wallet connection and `MemoryRouter` to avoid hash conflicts with Telegram.

### Web Dashboard (Next.js 16)

Server-rendered dashboard for exploring the registry:
- **/** — Registry stats and recent passports
- **/explore** — Full passport list
- **/passport/[address]** — Individual passport view
- **/verify** — Passport verification
- **/my** — Connected wallet's passports

Uses TanStack Query for data fetching and `@tonconnect/ui-react` for wallet integration.

### Infrastructure

- **nginx** — Reverse proxy, static file server, TONAPI key injection
- **pm2** — Process manager for bot and web services
- **UFW** — Firewall (ports 22, 80, 443)

---

## Architecture Decision Records

### ADR-001: SBT over NFT

**Decision:** Use TEP-85 Soulbound Token instead of standard TEP-62 NFT.

**Context:** Agent identity must be non-transferable. If passports could be traded, an attacker could buy a high-reputation passport and impersonate a trusted agent.

**Consequences:**
- Transfer always reverts ("SBT: transfer not allowed")
- Owner can destroy their own passport
- Authority (Registry) can revoke passports
- Passport cannot be sold on marketplaces
- Automatic recognition by TON explorers (Tonviewer, TonScan)

### ADR-002: Public Mint with Fee

**Decision:** Allow anyone to mint passports by paying a fee (0.05 TON), while keeping free admin mint.

**Context:** Initially only the Registry owner could mint (centralized). This created a bottleneck and dependency on admin availability.

**Consequences:**
- Decentralized: anyone can register an agent identity
- Anti-spam: 0.05 TON fee prevents abuse
- Revenue model: Registry owner can collect fees via `Withdraw`
- Admin can still mint for free (partnerships, testing, seeding)
- Excess TON is returned to sender

### ADR-003: Direct Wallet Signing over TonConnect for Bot

**Decision:** Bot signs transactions using mnemonic from `.env` instead of TonConnect sessions.

**Context:** TonConnect sessions in the bot were unreliable — they expired after restarts, requiring manual `/connect` via Telegram before each mint operation. This blocked automated features like demo seeding and API-based minting.

**Consequences:**
- Bot starts and is immediately ready to sign transactions
- No manual wallet connection step needed
- API mint and demo seed work without human interaction
- Mnemonic must be securely stored (`.env` file, `chmod 600`, not in git)
- Single point of failure if mnemonic is compromised

### ADR-004: nginx TONAPI Proxy

**Decision:** Proxy all TONAPI calls through nginx instead of calling TONAPI directly from client-side code.

**Context:** TONAPI key was exposed in client JavaScript bundles (`VITE_` and `NEXT_PUBLIC_` prefixes). Any user could extract the key from DevTools.

**Consequences:**
- API key stays on server, never reaches the client
- nginx adds `Authorization` header transparently
- Rate limiting applied at proxy level
- CORS restricted to own domain
- Single point of configuration for API key rotation

### ADR-005: Telegram Mini App as Primary UI

**Decision:** Build primary UI as Telegram Mini App rather than standalone web application.

**Context:** Target audience uses Telegram. Mini App provides native feel, wallet integration, and zero-friction access via bot button.

**Consequences:**
- Accessible directly from Telegram (no URL typing)
- Native theme adaptation via Telegram CSS variables
- Haptic feedback, MainButton, BackButton integration
- Limited to mobile viewport (~360-428px width)
- Must handle Telegram iframe constraints (`frame-ancestors`)
- `MemoryRouter` required to avoid URL hash conflicts with Telegram

### ADR-006: Trust Score — Server-Side Computation

**Decision:** Compute reputation server-side via API, with a matching client-side formula for instant preview.

**Context:** Trust score is based on on-chain data (txCount, capabilities, age). Computing exclusively on client would allow manipulation and inconsistent results.

**Consequences:**
- Server (`/api/reputation/:address`) is the source of truth
- Client has matching formula for instant display before API response
- Score is informational, not enforced on-chain
- Formula: existence(20) + activity(40) + age(20) + capabilities(20) = max 100
- See [TRUST_SCORE.md](TRUST_SCORE.md) for full formula documentation
