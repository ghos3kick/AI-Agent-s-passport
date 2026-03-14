# Agent Passport — On-chain Identity & Trust for AI Agents on TON

## Project Overview

**Track:** Track 1 — Agent Infrastructure ($10K)
**Hackathon:** TON AI Agent Hackathon
**Status:** All 3 phases complete. Next: deploy to testnet + demo.

Agent Passport is an on-chain identity and trust verification system for AI agents on TON blockchain — SBT-based registry where agents register identity, declare capabilities, and build verifiable transaction history.

## Current Task

**Public mint live on testnet. Registry redeployed.**
- Registry: `EQDRdykyEDAj9GgM3sPnkj9Y-OM6IG3wX_QmI40emh2HBxZS`
- Mint demo passports via `/mint` in bot or Self Mint in Mini App
- Record demo video + finalize README

## Project Structure

```
agent-passport/
├── contracts/              # Tact smart contracts (TEP-85 SBT)
│   ├── agent_registry.tact
│   └── agent_passport.tact
├── tests/                  # 16 passing tests (Blueprint + Sandbox)
├── wrappers/               # Auto-generated Tact wrappers
├── scripts/                # deployRegistry.ts, mintPassport.ts
├── build/                  # Compiled contract artifacts
├── packages/
│   ├── sdk/                # @agent-passport/sdk
│   │   └── src/            # client, registry, passport, verify, types, utils
│   ├── bot/                # Telegram bot (grammY)
│   │   └── src/
│   │       ├── handlers/   # start, help, connect, mypassport, lookup, verify, stats, mint
│   │       ├── conversations/  # mintFlow.ts (multi-step /mint)
│   │       ├── middleware/  # admin.ts, auth.ts, logging.ts
│   │       └── services/   # wallet.ts (TonConnect), passport.ts, mint.ts
│   └── web/                # Next.js 16 dashboard
│       ├── app/            # /, /explore, /passport/[address], /verify, /my
│       ├── components/     # layout, passport, registry, verify, wallet, ui
│       ├── hooks/          # useSDK, usePassport, usePassports, useMyPassports, useRegistryStats, useVerify
│       └── providers/      # TonConnectProvider, QueryProvider
├── metadata/               # sample-agent.json (TEP-64)
├── CLAUDE.md
└── README.md
```

## Solved Problems

- **MintPassport serialization** — opcode `3867318038`, uses `storeStringRefTail` for string fields (from compiled Tact output). Implemented manually in `services/mint.ts` to avoid `rootDir` violation in bot tsconfig.
- **grammY conversations v2** — requires `BaseContext` / `BotContext` split: `createConversation<BaseContext, BaseContext>` after `session()` and `conversations()` middleware.
- **tonapi stack parsing** — `get_passport_data` may return decoded struct or raw stack; passport.ts handles both cases.

## Tech Stack

- **Contracts:** Tact + Blueprint + Sandbox
- **SDK:** TypeScript, tonapi-sdk-js, @ton/core
- **Bot:** grammY v1, @grammyjs/conversations v2, @tonconnect/sdk
- **Web:** Next.js 16 (App Router), Tailwind v4, @tonconnect/ui-react, TanStack Query
- **Network:** TON testnet → mainnet

## Key Design Decisions

- **TEP-85 SBT** — standard compliance = automatic Tonviewer support
- **tonapi.io** for all reads — no direct RPC needed
- **On-chain capabilities + endpoint** — verifiable without off-chain trust
- **tx_counter** — simple reputation signal, authority-only increment
- **Web dashboard added** (beyond original scope) — stronger product quality score

## References

- TEP-85: https://github.com/ton-blockchain/TEPs/blob/master/text/0085-sbt-standard.md
- TEP-62: https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md
- TEP-64: https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md
- Tact docs: https://docs.tact-lang.org/
- grammY: https://grammy.dev/
- TON API: https://tonapi.io/
