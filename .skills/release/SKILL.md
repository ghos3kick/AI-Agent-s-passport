---
name: release
description: Full release cycle for Agent Passport — build, test, deploy, seed, verify. Use when the user wants to do a complete release, prepare for hackathon submission, ship a new version, or do a full rebuild and deploy cycle. Also triggers for "ship it", "prepare for submission", "full deploy", "rebuild everything".
---

# Release Cycle — Agent Passport

Complete build -> test -> deploy -> verify pipeline.

## Step 1: Tests

```bash
cd /opt/agent-passport
npx blueprint test
```
**STOP if any test fails.**

## Step 2: Build all packages

```bash
cd /opt/agent-passport

# SDK first (others depend on it)
cd packages/sdk && npm run build 2>/dev/null && cd ../..

# Bot
cd packages/bot && npm run build 2>/dev/null && cd ../..

# Web
cd packages/web && npm run build && cd ../..

# Mini App
cd packages/mini-app && npm run build && cd ../..
```
**STOP if any build fails.**

## Step 3: Restart services

```bash
pm2 restart all
sudo nginx -t && sudo systemctl reload nginx
sleep 3
```

## Step 4: Verify

```bash
echo "=== Services ==="
pm2 status

echo "=== API ==="
curl -s http://194.87.31.34/api/health

echo "=== Web ==="
curl -s -o /dev/null -w "Web: %{http_code}\n" http://194.87.31.34

echo "=== Mini App ==="
curl -s -o /dev/null -w "Mini App: %{http_code}\n" http://194.87.31.34/mini-app/

echo "=== Registry ==="
REGISTRY=$(grep REGISTRY_ADDRESS packages/bot/.env | cut -d= -f2)
curl -s "https://testnet.tonapi.io/v2/accounts/$REGISTRY" | grep '"status"'

echo "=== Security Quick Check ==="
grep -r "AGXP\|AAET" packages/mini-app/dist/ 2>/dev/null && echo "KEY LEAK" || echo "No key leaks"
git ls-files | grep -i "\.env" && echo "ENV IN GIT" || echo "No env in git"

echo "=== Wallet ==="
pm2 logs agent-passport-bot --lines 3 --nostream | grep -i "wallet\|initialized"
```

## Step 5: Commit & Push

```bash
cd /opt/agent-passport
git add -A
git status
# Verify: NO .env files in staged changes

git commit -m "release: v1.x.x — <short description>"
git push
```

## Step 6 (optional): Demo Seed

If registry is empty or after redeploy:
```bash
npx tsx scripts/demo-seed.ts
```

## Checklist

Report this to the user:

| Check | Status |
|-------|--------|
| Contract tests | ? |
| SDK build | ? |
| Bot build | ? |
| Web build | ? |
| Mini App build | ? |
| pm2 services | ? |
| API health | ? |
| Web accessible | ? |
| Mini App accessible | ? |
| Registry active | ? |
| No key leaks | ? |
| No env in git | ? |
| Wallet initialized | ? |
| Git pushed | ? |
