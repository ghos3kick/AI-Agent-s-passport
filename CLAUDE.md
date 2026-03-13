# Agent Passport — On-chain Identity & Trust for AI Agents on TON

## Project Overview

**Track:** Track 1 — Agent Infrastructure ($10K)
**Hackathon:** TON AI Agent Hackathon
**Deadline:** 2 weeks from start

Agent Passport is an on-chain identity and trust verification system for AI agents on TON blockchain. It provides a Soulbound Token (SBT) based registry where AI agents can register their identity, declare capabilities, and build verifiable transaction history. Other agents and users can verify an agent's trustworthiness before interacting with it.

### Core Components

1. **Smart Contract (Tact)** — SBT Collection + Agent Passport Items
2. **TypeScript SDK** — npm package for registering/querying/verifying agents
3. **Telegram Bot "Agent Explorer"** — user-facing tool to inspect any agent's passport

## Architecture

```
┌─────────────────────────────────────────────┐
│              TON Blockchain                  │
│                                              │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │  AgentRegistry   │  │  AgentPassport   │  │
│  │  (SBT Collection)│──│  (SBT Item)      │  │
│  │                  │  │                  │  │
│  │  - mint_passport │  │  - owner         │  │
│  │  - get_agent_by  │  │  - capabilities  │  │
│  │    _address      │  │  - endpoint      │  │
│  │  - total_agents  │  │  - created_at    │  │
│  │                  │  │  - tx_count      │  │
│  │                  │  │  - metadata_url  │  │
│  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────┘
          ▲                    ▲
          │                    │
┌─────────┴────────┐ ┌────────┴─────────┐
│  TypeScript SDK  │ │  Agent Explorer  │
│  (npm package)   │ │  (Telegram Bot)  │
│                  │ │                  │
│  - register()    │ │  /start          │
│  - verify()      │ │  /lookup <addr>  │
│  - getPassport() │ │  /stats          │
│  - getCapabilities│ │  inline search  │
└──────────────────┘ └──────────────────┘
```

## Smart Contract Design (Tact)

### AgentRegistry (Collection)
- Inherits SBT Collection pattern (TEP-85 over TEP-62)
- Stores: owner, next_item_index, collection_content, agent_code
- Messages:
  - `MintPassport { owner: Address, capabilities: String, endpoint: String, metadata_url: String }`
  - `UpdateCapabilities { agent_index: Int, capabilities: String }`
- Get-methods:
  - `get_collection_data()` — standard TEP-62
  - `get_nft_address_by_index(index: Int)` — standard TEP-62
  - `get_agent_count()` — total registered agents

### AgentPassport (SBT Item)
- Non-transferable (SBT, TEP-85)
- Stores: owner, collection_address, index, capabilities, endpoint, created_at, tx_counter, metadata_url
- Messages:
  - `IncrementTxCount {}` — called by authorized contracts to update stats
  - `UpdateEndpoint { endpoint: String }`
  - `RequestOwner { destination: Address, forward_payload: Cell, with_content: Bool }` — standard TEP-85
- Get-methods:
  - `get_nft_data()` — standard TEP-62
  - `get_passport_data()` — returns full agent info (capabilities, endpoint, tx_count, created_at)
  - `get_authority_address()` — standard TEP-85

## TypeScript SDK API

```typescript
import { AgentPassport } from '@agent-passport/sdk';

const passport = new AgentPassport({
  registryAddress: 'EQ...',
  network: 'testnet',
});

// Register a new agent
const result = await passport.register({
  wallet: senderWallet,
  capabilities: ['translation', 'summarization'],
  endpoint: 'https://myagent.com/api',
  metadataUrl: 'https://myagent.com/metadata.json',
});

// Verify an agent before interacting
const agent = await passport.verify('EQ_agent_address...');
// Returns: { isRegistered: bool, capabilities: string[], txCount: number, createdAt: Date, endpoint: string }

// Get all agents with specific capability
const translators = await passport.findByCapability('translation');
```

## Telegram Bot "Agent Explorer"

Commands:
- `/start` — welcome + explanation
- `/lookup <address or .ton domain>` — show agent's passport card
- `/stats` — total agents registered, top capabilities, network stats
- `/register` — guide for developers on how to register their agent
- Inline mode: type `@agent_explorer_bot <address>` in any chat to share agent passport card

Passport card (formatted message):
```
🤖 Agent Passport
━━━━━━━━━━━━━━━━
Address: EQx...abc
Status: ✅ Verified
Registered: 2026-03-10
Transactions: 147
Capabilities: translation, summarization
Endpoint: https://myagent.com/api
━━━━━━━━━━━━━━━━
Registry: EQr...xyz
```

## Tech Stack

- **Smart contracts:** Tact language + Blueprint (build/test/deploy)
- **SDK:** TypeScript, @ton/core, @ton/ton
- **Bot:** TypeScript, grammY framework
- **Network:** TON testnet for development, mainnet for demo
- **API:** tonapi.io or toncenter for reading on-chain data
- **Metadata:** off-chain JSON hosted on IPFS or static server (TEP-64 compliant)

## Project Structure

```
agent-passport/
├── contracts/              # Tact smart contracts
│   ├── agent_registry.tact
│   └── agent_passport.tact
├── tests/                  # Contract tests (Jest + Sandbox)
│   └── AgentRegistry.spec.ts
├── wrappers/               # TypeScript wrappers for contracts
│   ├── AgentRegistry.ts
│   └── AgentPassport.ts
├── scripts/                # Deploy and interaction scripts
│   ├── deployRegistry.ts
│   └── mintPassport.ts
├── sdk/                    # npm package source
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── package.json
│   └── tsconfig.json
├── bot/                    # Telegram bot
│   ├── src/
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   ├── start.ts
│   │   │   ├── lookup.ts
│   │   │   └── stats.ts
│   │   └── utils/
│   │       └── formatPassport.ts
│   ├── package.json
│   └── tsconfig.json
├── metadata/               # Sample metadata JSON files
│   └── sample-agent.json
├── CLAUDE.md               # This file
├── README.md               # Project documentation (for hackathon submission)
└── package.json            # Root workspace
```

## Development Plan

### Week 1: Smart Contract + SDK
- Day 1-2: Scaffold project with Blueprint, write AgentRegistry + AgentPassport contracts in Tact
- Day 3-4: Write comprehensive tests using Sandbox (local blockchain emulator)
- Day 5: Deploy to testnet, verify contracts work
- Day 6-7: Build TypeScript SDK wrapper (register, verify, getPassport, findByCapability)

### Week 2: Bot + Polish + Demo
- Day 8-9: Build Telegram bot with grammY (lookup, stats, inline mode)
- Day 10-11: Integration testing — register demo agents, verify via bot
- Day 12: Deploy to mainnet, polish UI/UX of bot messages
- Day 13: Record demo video, write README
- Day 14: Submit

## Key Design Decisions

- **Tact over FunC/Tolk**: Better developer experience, strong typing, good for hackathon speed. ~33% of TON contracts use Tact.
- **SBT (TEP-85) over custom contract**: Standards compliance = ecosystem value. Explorers like Tonviewer will recognize our tokens automatically.
- **Off-chain metadata (TEP-64)**: Capabilities list and endpoint stored on-chain in contract storage. Extended metadata (description, icon, docs) via off-chain JSON URL.
- **tx_counter on-chain**: Simple but verifiable reputation signal. Incremented by authorized contracts only.
- **Telegram bot over web app**: Faster to build, native to TON ecosystem, judges can test instantly.

## Judging Criteria Alignment

- **Product quality (25%)**: Working bot with clean passport cards, inline sharing, real on-chain data
- **Technical execution (25%)**: Custom Tact smart contract following TEP-85 standard, typed SDK, comprehensive tests
- **Ecosystem value (25%)**: Reusable primitive — any agent builder can integrate the SDK. SBT standard means automatic explorer support
- **User potential (25%)**: Every AI agent on TON needs identity. As agent ecosystem grows, this becomes essential infrastructure

## Important Notes

- Always deploy and test on testnet first (`@testgiver_ton_bot` for test TON)
- Follow TEP-85 spec strictly for SBT compatibility
- Contract must pass all standard get-method requirements (TEP-62 + TEP-85)
- Keep SDK API surface minimal — register, verify, query
- Bot responses must be fast — cache on-chain data, don't query blockchain on every request
- Metadata JSON must follow TEP-64 format for explorer compatibility

## References

- TEP-85 (SBT): https://github.com/ton-blockchain/TEPs/blob/master/text/0085-sbt-standard.md
- TEP-62 (NFT): https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md
- TEP-64 (Metadata): https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md
- Tact docs: https://docs.tact-lang.org/
- Blueprint: https://docs.ton.org/contract-dev/blueprint/overview
- SBT how it works: https://docs.ton.org/standard/tokens/nft/sbt
- grammY: https://grammy.dev/
- TON API: https://tonapi.io/
- @ton/mcp: https://docs.ton.org/ecosystem/ai/mcp
