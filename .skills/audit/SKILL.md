---
name: audit
description: Run security audit on Agent Passport project. Use this skill when the user mentions security, audit, pentest, vulnerabilities, leaks, secret scanning, or wants to verify the project is secure. Also use when preparing for production or mainnet deployment.
---

# Security Audit — Agent Passport

## Quick scan (< 2 min)

Run these checks first for a fast overview:

### 1. Secrets in git
```bash
cd /opt/agent-passport
git ls-files | grep -i "\.env"
# Should return NOTHING

grep -rn "AAET\|AGXP\|Bearer\|mnemonic\|seed\|private.key" \
  --include="*.ts" --include="*.tsx" --include="*.json" \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist .
```

### 2. Client bundle leaks
```bash
grep -r "AGXP\|AAET\|Bearer" packages/mini-app/dist/ 2>/dev/null && echo "KEY IN BUNDLE" || echo "OK"
grep -r "AGXP\|AAET\|Bearer" packages/web/.next/static/ 2>/dev/null && echo "KEY IN BUNDLE" || echo "OK"
```

### 3. File permissions
```bash
stat -c '%a %n' packages/bot/.env packages/web/.env.local packages/mini-app/.env 2>/dev/null
# All should be 600
```

### 4. Firewall
```bash
sudo ufw status | head -10
```

### 5. SSH
```bash
grep -E "PermitRootLogin|PasswordAuthentication" /etc/ssh/sshd_config | grep -v "^#"
# PermitRootLogin should be "prohibit-password" or "no"
# PasswordAuthentication should be "no"
```

### 6. Open ports
```bash
ss -tlnp | grep -v "127.0.0.1"
# Only 22, 80, 443 should be open externally
```

### 7. npm audit
```bash
cd /opt/agent-passport && npm audit 2>&1 | tail -5
```

### 8. Admin bypass check
```bash
grep -A5 "adminAddress\|ADMIN_ADDRESS" packages/bot/src/middleware/*.ts 2>/dev/null
# Should deny when adminAddress is empty
```

## Full audit

For comprehensive audit, follow the 8-phase methodology:
1. Secret leaks & configuration
2. Smart contract analysis (read contracts/agent_registry.tact, contracts/agent_passport.tact)
3. Telegram bot security (packages/bot/src/)
4. Web application security (packages/web/, packages/mini-app/)
5. Dependency vulnerabilities
6. Server security
7. DoS analysis (code review only)
8. Logical vulnerabilities

## Output

Generate report with:
- Date
- Score (1-10)
- Findings by severity (CRITICAL / HIGH / MEDIUM / LOW / OK)
- Action items
