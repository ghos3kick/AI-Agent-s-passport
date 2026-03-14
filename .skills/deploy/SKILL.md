---
name: deploy
description: Deploy or redeploy Agent Passport Registry contract to TON blockchain. Use this skill whenever the user mentions deploying, redeploying, updating contracts, or switching between testnet/mainnet. Also triggers for "update registry address", "new contract", "contract deploy".
---

# Deploy Agent Passport Registry

## When to use
- Deploy new Registry contract (fresh or after code changes)
- Redeploy after contract modifications
- Switch network (testnet <-> mainnet)

## Pre-flight checks

1. Verify contract compiles:
```bash
cd /opt/agent-passport
npx blueprint build
```

2. Run ALL tests:
```bash
npx blueprint test
```
ALL tests must pass. Do NOT deploy if any test fails.

3. Verify wallet has funds:
```bash
# Read MNEMONIC from bot .env, derive address, check balance via TONAPI
```

## Deploy steps

1. **ASK the user** for confirmation and network (testnet/mainnet)
2. Run deploy script:
```bash
cd /opt/agent-passport
npx blueprint run deployRegistry --testnet  # or --mainnet
```
3. The script will ask for mnemonic — **ASK the user**, do not generate
4. Wait for deployment, capture new address from output

## Post-deploy (CRITICAL — do all of these)

After getting the new Registry address:

1. **Update REGISTRY_ADDRESS everywhere:**
```bash
NEW_ADDR="<new address>"
OLD_ADDR=$(grep REGISTRY_ADDRESS packages/bot/.env | cut -d= -f2)

# Bot
sed -i "s|REGISTRY_ADDRESS=.*|REGISTRY_ADDRESS=$NEW_ADDR|" packages/bot/.env

# Web
sed -i "s|$OLD_ADDR|$NEW_ADDR|g" packages/web/.env.local

# Mini App
sed -i "s|$OLD_ADDR|$NEW_ADDR|g" packages/mini-app/.env 2>/dev/null

# Docs
sed -i "s|$OLD_ADDR|$NEW_ADDR|g" docs/*.md README.md CLAUDE.md 2>/dev/null
```

2. **Verify no old address remains:**
```bash
grep -rn "$OLD_ADDR" packages/ docs/ README.md CLAUDE.md --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist
```

3. **Rebuild everything:**
```bash
cd /opt/agent-passport
cd packages/sdk && npm run build 2>/dev/null && cd ../..
cd packages/web && npm run build && cd ../..
cd packages/mini-app && npm run build && cd ../..
cd packages/bot && npm run build 2>/dev/null && cd ../..
```

4. **Restart services:**
```bash
pm2 restart all
sudo nginx -t && sudo systemctl reload nginx
```

5. **Verify deployment:**
```bash
# Contract active
curl -s "https://testnet.tonapi.io/v2/accounts/$NEW_ADDR" | grep '"status"'

# API works
curl -s http://localhost:3001/api/health

# Mini App works
curl -s -o /dev/null -w "%{http_code}" http://194.87.31.34/mini-app/

# All services online
pm2 status
```

6. **Report to user:**
   - Old address
   - New address
   - Deployment status
   - Services status
   - Suggest running demo seed if registry is empty

## Rollback

If deployment fails:
- Old contract still exists on-chain (immutable)
- Revert .env changes from backups
- `pm2 restart all`
