# Self-Hosting Guide

Deploy your own Agent Passport instance on a VPS.

## Prerequisites

- VPS with Ubuntu 22+ (2 GB RAM minimum)
- Node.js 20 LTS
- nginx
- TON wallet with testnet or mainnet TON
- Telegram bot token from [@BotFather](https://t.me/BotFather)
- TONAPI key from [tonapi.io](https://tonapi.io)

## 1. Clone and Install

```bash
git clone https://github.com/ghos3kick/AI-Agent-s-passport.git
cd AI-Agent-s-passport
npm install
```

## 2. Deploy Contracts

Build and deploy the Registry contract:

```bash
npx blueprint build
npx blueprint run deployRegistry
```

Save the deployed Registry address — you'll need it for environment configuration.

## 3. Configure Environment

### Bot (`packages/bot/.env`)

```env
BOT_TOKEN=your-telegram-bot-token
MNEMONIC=your 24 word wallet mnemonic phrase here
TONAPI_KEY=your-tonapi-key
REGISTRY_ADDRESS=EQD...your-registry-address
NETWORK=testnet
ADMIN_ADDRESS=your-admin-wallet-address
ADMIN_API_KEY=your-secret-admin-key
TONCONNECT_MANIFEST_URL=https://yourdomain.com/tonconnect-manifest.json
```

### Mini App (`packages/mini-app/.env`)

```env
VITE_REGISTRY_ADDRESS=EQD...your-registry-address
VITE_NETWORK=testnet
VITE_TONCONNECT_MANIFEST_URL=https://yourdomain.com/tonconnect-manifest.json
```

### Web Dashboard (`packages/web/.env.local`)

```env
TONAPI_KEY=your-tonapi-key
NEXT_PUBLIC_REGISTRY_ADDRESS=EQD...your-registry-address
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_TONCONNECT_MANIFEST_URL=https://yourdomain.com/tonconnect-manifest.json
```

Secure the env files:

```bash
chmod 600 packages/bot/.env packages/web/.env.local packages/mini-app/.env
```

## 4. Build All Packages

```bash
# SDK (must be built first — other packages depend on it)
cd packages/sdk && npm run build && cd ../..

# Bot
cd packages/bot && npm run build && cd ../..

# Mini App
cd packages/mini-app && npm run build && cd ../..

# Web Dashboard
cd packages/web && npm run build && cd ../..
```

## 5. Setup nginx

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Bot API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Mini App (static files from Vite build)
    location /mini-app/ {
        alias /opt/agent-passport/packages/mini-app/dist/;
        try_files $uri $uri/ /mini-app/index.html;
    }

    # TONAPI proxy (hides API key from client)
    location /tonapi/ {
        proxy_pass https://tonapi.io/;
        proxy_set_header Authorization "Bearer YOUR_TONAPI_KEY";
        proxy_set_header Host tonapi.io;
    }

    # TON Connect manifest
    location /tonconnect-manifest.json {
        alias /opt/agent-passport/packages/mini-app/public/tonconnect-manifest.json;
    }

    # Web Dashboard (catch-all)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/agent-passport /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Start Services with pm2

```bash
npm install -g pm2

# Bot (Express API + Telegram bot)
pm2 start packages/bot/dist/index.js --name agent-bot

# Web Dashboard
pm2 start npm --name agent-web -- run start --prefix packages/web

# Save and enable autostart
pm2 save
pm2 startup
```

## 7. HTTPS (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

After HTTPS is configured, update:
- `TONCONNECT_MANIFEST_URL` in all `.env` files
- BotFather Mini App URL
- nginx config if needed

## Environment Variables Reference

### Bot

| Variable | Required | Description |
|----------|----------|-------------|
| BOT_TOKEN | yes | Telegram bot token from @BotFather |
| MNEMONIC | yes | 24-word wallet mnemonic (Registry owner) |
| TONAPI_KEY | yes | API key from tonapi.io |
| REGISTRY_ADDRESS | yes | Deployed Registry contract address |
| NETWORK | yes | `testnet` or `mainnet` |
| ADMIN_ADDRESS | yes | Admin wallet address (for `/mint` access) |
| ADMIN_API_KEY | yes | Secret key for admin API endpoints |
| TONCONNECT_MANIFEST_URL | yes | Public URL to tonconnect-manifest.json |
| TONCENTER_API_KEY | no | TonCenter API key (optional, for higher limits) |

### Mini App

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_REGISTRY_ADDRESS | yes | Registry contract address |
| VITE_NETWORK | yes | `testnet` or `mainnet` |
| VITE_TONCONNECT_MANIFEST_URL | yes | Public URL to manifest |

### Web Dashboard

| Variable | Required | Description |
|----------|----------|-------------|
| TONAPI_KEY | yes | TONAPI key (server-side only) |
| NEXT_PUBLIC_REGISTRY_ADDRESS | yes | Registry contract address |
| NEXT_PUBLIC_NETWORK | yes | `testnet` or `mainnet` |
| NEXT_PUBLIC_TONCONNECT_MANIFEST_URL | yes | Public URL to manifest |

## Security Checklist

- [ ] `.env` files have `chmod 600` permissions
- [ ] Mnemonic is not committed to git (check `.gitignore`)
- [ ] TONAPI key is not exposed in client bundles (use nginx proxy)
- [ ] `ADMIN_API_KEY` is a strong random string
- [ ] UFW firewall enabled: only ports 22, 80, 443 open
- [ ] Bot API binds to `127.0.0.1:3001` (not `0.0.0.0`)
- [ ] Web dashboard binds to `127.0.0.1:3000`
- [ ] nginx handles all external traffic
- [ ] HTTPS enabled with valid certificate
- [ ] pm2 configured with `pm2 startup` for auto-restart
