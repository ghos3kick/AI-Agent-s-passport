#!/usr/bin/env bash
set -euo pipefail

# VPS Final Fix Script — run as root on 194.87.31.34
# Usage: bash /opt/agent-passport/scripts/vps-fix.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

cd /opt/agent-passport

echo "========================================"
echo "  VPS FINAL FIX"
echo "========================================"
echo ""

# --- 1. Git pull ---
echo "--- 1. Git pull ---"
git stash 2>/dev/null || true
git pull origin main
git stash pop 2>/dev/null || true
ok "Code updated"
echo ""

# --- 2. Remove .bak files ---
echo "--- 2. Remove .bak files ---"
BAK_FILES=$(find /opt/agent-passport -name "*.bak" -o -name "*.backup" -o -name "*.old" 2>/dev/null | grep -v node_modules || true)
if [ -n "$BAK_FILES" ]; then
    echo "$BAK_FILES" | xargs rm -v
    ok "Removed .bak files"
else
    ok "No .bak files found"
fi
echo ""

# --- 3. TONAPI Bearer → nginx snippet ---
echo "--- 3. TONAPI Bearer → nginx snippet ---"
NGINX_CONF="/etc/nginx/sites-enabled/agent-passport"

if grep -q "Bearer" "$NGINX_CONF" 2>/dev/null; then
    TONAPI_KEY=$(grep "Bearer" "$NGINX_CONF" | grep -oP 'Bearer \K[^"]+' | head -1)
    if [ -n "$TONAPI_KEY" ]; then
        mkdir -p /etc/nginx/snippets
        cat > /etc/nginx/snippets/tonapi-auth.conf << EOF
proxy_set_header Authorization "Bearer $TONAPI_KEY";
EOF
        chmod 600 /etc/nginx/snippets/tonapi-auth.conf
        sed -i 's|proxy_set_header Authorization "Bearer.*";|include /etc/nginx/snippets/tonapi-auth.conf;|' "$NGINX_CONF"
        ok "TONAPI key moved to snippet"
    else
        warn "Could not extract Bearer token"
    fi
else
    ok "Bearer already not inline (snippet may already be set)"
fi
echo ""

# --- 4. Hide nginx version ---
echo "--- 4. server_tokens off ---"
if ! grep -q "server_tokens off" /etc/nginx/nginx.conf; then
    sed -i '/http {/a \    server_tokens off;' /etc/nginx/nginx.conf
    ok "Added server_tokens off"
else
    ok "server_tokens off already set"
fi
echo ""

# --- 5. SSH hardening ---
echo "--- 5. SSH hardening ---"
KEY_COUNT=$(cat ~/.ssh/authorized_keys 2>/dev/null | grep -c . || echo "0")
if [ "$KEY_COUNT" -ge 1 ]; then
    cp /etc/ssh/sshd_config "/etc/ssh/sshd_config.backup-$(date +%Y%m%d)" 2>/dev/null || true
    sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
    sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
    sshd -t && systemctl restart sshd
    ok "SSH hardened (key auth only)"
else
    fail "NO SSH KEY FOUND — skipping SSH hardening to avoid lockout!"
    warn "Add your SSH key first, then re-run this section manually"
fi
echo ""

# --- 6. UFW Firewall ---
echo "--- 6. UFW Firewall ---"
apt install -y ufw > /dev/null 2>&1 || true
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
ok "UFW enabled (22, 80, 443)"
echo ""

# --- 7. Nginx reload ---
echo "--- 7. Nginx test & reload ---"
if nginx -t 2>&1; then
    systemctl reload nginx
    ok "Nginx reloaded"
else
    fail "Nginx config test failed — fix manually!"
    exit 1
fi
echo ""

# --- 8. Rebuild packages ---
echo "--- 8. Rebuild packages ---"
cd /opt/agent-passport

echo "  Building SDK..."
(cd packages/sdk && npm run build 2>/dev/null) && ok "SDK built" || warn "SDK build skipped"

echo "  Building Bot..."
(cd packages/bot && npm run build 2>/dev/null) && ok "Bot built" || warn "Bot build skipped"

echo "  Building Web..."
(cd packages/web && npm run build 2>&1 | tail -3) && ok "Web built" || warn "Web build failed"

echo "  Building Mini App..."
(cd packages/mini-app && npm run build 2>&1 | tail -3) && ok "Mini App built" || warn "Mini App build failed"
echo ""

# --- 9. Restart services ---
echo "--- 9. Restart services ---"
pm2 restart all
sleep 3
pm2 status
echo ""

# --- 10. Full verification ---
echo "========================================"
echo "  FULL QUALITY CHECK"
echo "========================================"
echo ""

echo "--- Services ---"
pm2 status
echo ""

echo "--- Endpoints ---"
curl -s -o /dev/null -w "API Health:     %{http_code}\n" http://194.87.31.34/api/health
curl -s -o /dev/null -w "Mini App:       %{http_code}\n" http://194.87.31.34/mini-app/
curl -s -o /dev/null -w "Web Dashboard:  %{http_code}\n" http://194.87.31.34
curl -s -o /dev/null -w "TONAPI proxy:   %{http_code}\n" http://194.87.31.34/tonapi/v2/status
echo ""

echo "--- Security ---"
echo -n ".bak files:              "
[ "$(find /opt/agent-passport -name '*.bak' -not -path '*/node_modules/*' 2>/dev/null | wc -l)" -eq 0 ] && echo -e "${GREEN}None${NC}" || echo -e "${RED}Found${NC}"

echo -n "Bearer in nginx config:  "
grep -q "Bearer" /etc/nginx/sites-enabled/agent-passport 2>/dev/null && echo -e "${RED}Exposed${NC}" || echo -e "${GREEN}In snippet${NC}"

echo -n "nginx version:           "
curl -sI http://194.87.31.34 | grep -qi "nginx/[0-9]" && echo -e "${RED}Exposed${NC}" || echo -e "${GREEN}Hidden${NC}"

echo -n "SSH password auth:       "
grep "^PasswordAuthentication" /etc/ssh/sshd_config | grep -q "no" && echo -e "${GREEN}Disabled${NC}" || echo -e "${RED}Enabled${NC}"

echo -n "Firewall:                "
ufw status 2>/dev/null | grep -q "active" && echo -e "${GREEN}Active${NC}" || echo -e "${RED}Inactive${NC}"

echo -n "Key in mini-app bundle:  "
grep -rq "AGXP\|AAET" packages/mini-app/dist/ 2>/dev/null && echo -e "${RED}LEAK${NC}" || echo -e "${GREEN}Clean${NC}"

echo -n "Key in web bundle:       "
grep -rq "AGXP\|AAET" packages/web/.next/static/ 2>/dev/null && echo -e "${RED}LEAK${NC}" || echo -e "${GREEN}Clean${NC}"

echo -n ".env in git:             "
[ "$(git ls-files | grep -ci '\.env')" -eq 0 ] && echo -e "${GREEN}Clean${NC}" || echo -e "${RED}Found${NC}"
echo ""

echo "--- Blockchain ---"
REGISTRY=$(grep REGISTRY_ADDRESS packages/bot/.env 2>/dev/null | cut -d= -f2 || echo "")
if [ -n "$REGISTRY" ]; then
    echo -n "Registry active:         "
    curl -s "https://testnet.tonapi.io/v2/accounts/$REGISTRY" | grep -q '"active"' && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}"
fi
echo ""

echo "--- Code Quality ---"
echo -n "Dead wallet.ts:          "
[ ! -f packages/bot/src/services/wallet.ts ] && echo -e "${GREEN}Removed${NC}" || echo -e "${RED}Exists${NC}"

echo -n "Dead menus/:             "
[ ! -d packages/bot/src/menus ] && echo -e "${GREEN}Removed${NC}" || echo -e "${RED}Exists${NC}"
echo ""

echo "========================================"
echo "  DONE"
echo "========================================"
