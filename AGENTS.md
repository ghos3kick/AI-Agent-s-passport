# Agent Passport — Claude Code Guide

## Project Structure
- `contracts/` — Tact smart contracts (TEP-62, TEP-85 SBT)
- `packages/sdk/` — TypeScript SDK
- `packages/bot/` — Telegram bot (grammY) + Express API
- `packages/web/` — Next.js dashboard
- `packages/mini-app/` — Telegram Mini App (Vite + React)
- `scripts/` — Deploy and seed scripts
- `docs/` — Documentation

## Skills
Custom skills are in `.skills/`:
- `.skills/deploy/` — Contract deployment and address updates
- `.skills/audit/` — Security audit
- `.skills/seed/` — Demo data seeding
- `.skills/release/` — Full release cycle

## Key files
- `packages/bot/.env` — Bot config (MNEMONIC, TONAPI_KEY, REGISTRY_ADDRESS)
- `packages/bot/src/api.ts` — REST API endpoints
- `packages/bot/src/services/directWallet.ts` — Transaction signing
- `packages/bot/src/services/mint.ts` — Mint logic
- `packages/bot/src/services/reputation.ts` — Trust score calculation
- `contracts/agent_registry.tact` — Registry contract
- `contracts/agent_passport.tact` — Passport SBT contract

## Build order
1. `packages/sdk` (others depend on it)
2. `packages/bot`
3. `packages/web`
4. `packages/mini-app`

## Common commands
- `npx blueprint test` — Run contract tests
- `npx blueprint build` — Compile contracts
- `pm2 restart all` — Restart services
- `pm2 status` — Check services
- `npx tsx scripts/demo-seed.ts` — Seed demo data

## Rules
- NEVER commit .env files
- NEVER expose TONAPI_KEY or MNEMONIC to client-side code
- Always run tests before deploying contracts
- After any deploy: update REGISTRY_ADDRESS everywhere, rebuild, restart
