# 🪪 Agent Passport

> On-chain identity layer for AI agents on TON blockchain

Agent Passport is an SBT-based identity and trust verification system for AI agents on TON. Agents register on-chain identity, declare capabilities and API endpoints, and build verifiable transaction history — creating a trustless reputation layer for the AI agent ecosystem.

## 🔑 Key Features

- 🔒 **Soulbound Identity** — Non-transferable SBT passports (TEP-85), one per agent
- 📡 **On-chain Capabilities** — Agents declare what they can do, verifiable without off-chain trust
- 📊 **Reputation Signal** — `tx_counter` tracks agent activity, incremented by authority only
- ✅ **Instant Verification** — Verify any agent's passport authenticity via SDK, bot, or web
- 🤖 **Telegram Bot** — Mint, lookup, and verify passports directly from Telegram
- 🌐 **Web Dashboard** — Browse, explore, and verify passports with wallet integration

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  TON Blockchain (testnet)                │
│  ┌───────────────────┐    ┌──────────────────────────┐  │
│  │  AgentRegistry     │───▶│  AgentPassport (SBT)     │  │
│  │  TEP-62 Collection │    │  Non-transferable, TEP-85│  │
│  └─────────┬─────────┘    └──────────────────────────┘  │
│            │                                             │
└────────────┼─────────────────────────────────────────────┘
             │
   ┌─────────┴──────────────────────────────┐
   │         @agent-passport/sdk            │
   │   TypeScript · tonapi.io · @ton/core   │
   └──┬─────────────────────────────────┬───┘
      │                                 │
 ┌────▼─────────┐              ┌───────▼──────────┐
 │  Telegram Bot │              │  Web Dashboard   │
 │  grammY v1    │              │  Next.js 16      │
 │  TON Connect  │              │  Tailwind v4     │
 │  8 commands   │              │  TON Connect     │
 │  Admin mint   │              │  TanStack Query  │
 └───────────────┘              └──────────────────┘
```

## 📦 Project Structure

```
agent-passport/
├── contracts/          # Tact smart contracts (TEP-62, TEP-85 SBT)
│   ├── agent_registry.tact   # Collection: mint, batch ops, getters
│   └── agent_passport.tact   # SBT item: identity, capabilities, reputation
├── tests/              # 16 passing tests (Blueprint + Sandbox)
├── scripts/            # deployRegistry.ts, mintPassport.ts
├── packages/
│   ├── sdk/            # @agent-passport/sdk — shared TypeScript SDK
│   ├── bot/            # Telegram bot (grammY) — mint, lookup, verify
│   └── web/            # Next.js 16 dashboard — passport explorer
└── metadata/           # TEP-64 metadata samples
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Tact, Blueprint, Sandbox, TEP-62/85 |
| SDK | TypeScript, tonapi-sdk-js, @ton/core |
| Bot | grammY v1, @grammyjs/conversations v2, @tonconnect/sdk |
| Web | Next.js 16, React 19, Tailwind v4, @tonconnect/ui-react, TanStack Query |
| Network | TON Testnet |

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/ghos3kick/AI-Agent-s-passport.git
cd AI-Agent-s-passport

# Install dependencies
npm install

# Build contracts
npx blueprint build

# Run tests (16 tests)
npx blueprint test

# Deploy registry to testnet
npx blueprint run deployRegistry

# Start bot
cd packages/bot && npm run dev

# Start web dashboard
cd packages/web && npm run dev
```

## 📜 Smart Contracts

### AgentRegistry (TEP-62 Collection)

The registry is a standard NFT collection that mints SBT passports for AI agents.

| Method | Description |
|--------|-------------|
| `MintPassport` | Deploy new SBT passport (owner only) |
| `BatchIncrementTxCount` | Increment agent's tx counter (owner only) |
| `BatchUpdateCapabilities` | Update agent capabilities (owner only) |
| `get_collection_data()` | TEP-62: collection metadata |
| `get_nft_address_by_index()` | TEP-62: compute passport address |
| `get_agent_count()` | Total registered agents |

### AgentPassport (TEP-85 SBT)

Each passport is a non-transferable Soulbound Token storing agent identity.

**Stored data:** owner, capabilities, endpoint, metadataUrl, createdAt, txCount, revokedAt

| Method | Description |
|--------|-------------|
| `Transfer` | **Rejected** — SBT is non-transferable |
| `ProveOwnership` | TEP-85: cryptographic ownership proof (owner only) |
| `RequestOwner` | TEP-85: query owner info (anyone) |
| `Revoke` | TEP-85: revoke passport (authority only) |
| `Destroy` | TEP-85: destroy passport (owner only) |
| `UpdateEndpoint` | Change agent API endpoint (owner only) |
| `IncrementTxCount` | Increment reputation counter (authority only) |
| `UpdateCapabilities` | Update declared capabilities (authority only) |
| `get_passport_data()` | Full passport data |
| `get_authority_address()` | TEP-85: authority address |
| `get_revoked_time()` | TEP-85: revocation timestamp |

### Security

- Owner-only minting via `requireOwner()`
- Non-transferable (transfers always revert)
- Authority-based revocation and capability updates
- Collection origin verification on `SetupPassport`
- Initialization guard prevents double-setup

## 🤖 Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message + quick actions |
| `/help` | List available commands |
| `/connect` | Connect TON wallet via TON Connect |
| `/mint` | Mint new passport (admin only, multi-step flow) |
| `/mypassport` | View your own passport |
| `/lookup` | Find passport by owner address |
| `/verify` | Verify passport authenticity |
| `/stats` | Registry statistics |

## 🌐 Web Dashboard

Built with Next.js 16 (App Router), Tailwind v4, and TON Connect.

- **Home** — Hero section, recent passports
- **Explore** — Browse all registered passports with pagination
- **Passport Detail** — Full passport view by address
- **Verify** — Verify any passport's authenticity
- **My Passports** — View passports linked to connected wallet

## 🔐 Security

- Owner-only minting (admin deny-by-default)
- SBT non-transferability enforced at contract level
- TEP-85 authority model for revocation
- Collection address validation against spoofing
- API keys proxied through backend

## 🌐 Live Demo

- **Registry Contract**: [EQCvLEpNMxHY8UoUUU3ARg3ntjt9eM430w-CUt4ypPDXoP9M](https://testnet.tonviewer.com/EQCvLEpNMxHY8UoUUU3ARg3ntjt9eM430w-CUt4ypPDXoP9M)
- **Network**: TON Testnet
- **GitHub**: [ghos3kick/AI-Agent-s-passport](https://github.com/ghos3kick/AI-Agent-s-passport)

## 📄 License

MIT — see [LICENSE](LICENSE)
