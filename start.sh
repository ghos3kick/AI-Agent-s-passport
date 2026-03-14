#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[start]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err()  { echo -e "${RED}[error]${NC} $1"; }

# ── Check prerequisites ─────────────────────────────────────────────
command -v node >/dev/null 2>&1 || { err "Node.js not found. Install it first."; exit 1; }
command -v npm  >/dev/null 2>&1 || { err "npm not found."; exit 1; }

# ── Create .env files from templates if missing ─────────────────────
create_env() {
  local target="$1" template="$2"
  if [ ! -f "$target" ]; then
    if [ -f "$template" ]; then
      cp "$template" "$target"
      warn "Created $target from template — edit it with your keys"
    else
      warn "Missing $target — create it manually"
    fi
  fi
}

create_env "$ROOT_DIR/packages/bot/.env"       "$ROOT_DIR/packages/bot/.env.bak"
create_env "$ROOT_DIR/packages/web/.env.local"  "$ROOT_DIR/packages/web/.env.local.bak"
create_env "$ROOT_DIR/packages/mini-app/.env"   "$ROOT_DIR/packages/mini-app/.env.bak"

# ── Install dependencies ────────────────────────────────────────────
log "Installing dependencies..."
cd "$ROOT_DIR"
npm install --no-audit --no-fund 2>&1 | tail -1

# ── Build SDK (other packages depend on it) ─────────────────────────
log "Building SDK..."
cd "$ROOT_DIR/packages/sdk"
npm run build 2>&1 | tail -1

# ── Parse arguments ─────────────────────────────────────────────────
COMPONENT="${1:-all}"

start_bot() {
  log "Starting Telegram bot..."
  cd "$ROOT_DIR/packages/bot"
  if [ ! -f .env ]; then
    err "packages/bot/.env not found — cannot start bot"
    return 1
  fi
  npm run dev &
  echo $! > "$ROOT_DIR/.pid-bot"
}

start_web() {
  log "Starting web dashboard (Next.js)..."
  cd "$ROOT_DIR/packages/web"
  npm run dev &
  echo $! > "$ROOT_DIR/.pid-web"
}

start_mini_app() {
  log "Starting mini-app (Vite)..."
  cd "$ROOT_DIR/packages/mini-app"
  npm run dev &
  echo $! > "$ROOT_DIR/.pid-mini-app"
}

# ── Cleanup on exit ─────────────────────────────────────────────────
cleanup() {
  log "Stopping services..."
  for pidfile in "$ROOT_DIR"/.pid-*; do
    [ -f "$pidfile" ] && kill "$(cat "$pidfile")" 2>/dev/null && rm -f "$pidfile"
  done
}
trap cleanup EXIT INT TERM

# ── Start requested components ──────────────────────────────────────
case "$COMPONENT" in
  all)
    start_bot
    start_web
    start_mini_app
    ;;
  bot)       start_bot ;;
  web)       start_web ;;
  mini-app)  start_mini_app ;;
  *)
    err "Unknown component: $COMPONENT"
    echo "Usage: ./start.sh [all|bot|web|mini-app]"
    exit 1
    ;;
esac

log "All services started. Press Ctrl+C to stop."
echo ""
echo "  Bot:       running (long-polling)"
echo "  Web:       http://localhost:3000"
echo "  Mini-app:  http://localhost:5173"
echo ""

# Wait for all background processes
wait
