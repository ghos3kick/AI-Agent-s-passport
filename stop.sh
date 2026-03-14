#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[stop]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }

stopped=0

for pidfile in "$ROOT_DIR"/.pid-*; do
  [ -f "$pidfile" ] || continue
  name="${pidfile##*/.pid-}"
  pid="$(cat "$pidfile")"

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    # Wait up to 5s for graceful shutdown
    for _ in $(seq 1 50); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.1
    done
    # Force kill if still alive
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null
    fi
    log "Stopped $name (pid $pid)"
  else
    warn "$name (pid $pid) was not running"
  fi

  rm -f "$pidfile"
  stopped=$((stopped + 1))
done

if [ "$stopped" -eq 0 ]; then
  warn "No services found running (no .pid-* files)"
else
  log "Done — stopped $stopped service(s)"
fi

# Kill orphan bot processes (ts-node)
bot_pids="$(pgrep -f 'ts-node.*index\.ts' 2>/dev/null || true)"
if [ -n "$bot_pids" ]; then
  echo "$bot_pids" | xargs kill 2>/dev/null || true
  log "Killed orphan bot process(es)"
fi

# Kill orphan next dev processes and remove lock file
next_pids="$(pgrep -f 'next dev' 2>/dev/null || true)"
if [ -n "$next_pids" ]; then
  echo "$next_pids" | xargs kill 2>/dev/null || true
  log "Killed orphan next dev process(es)"
fi
rm -f "$ROOT_DIR/packages/web/.next/dev/lock"
