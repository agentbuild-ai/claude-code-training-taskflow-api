#!/usr/bin/env bash
# =============================================================================
# TaskFlow Workshop — Full Reset (backend)
# Wipes node_modules, lockfile, dist, and any local SQLite db, then
# reinstalls cleanly using whatever Node version is currently active.
#
# Usage: bash ../scripts/reset.sh   (run from inside the backend/ folder)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}TaskFlow API — Full Reset${RESET}"
echo "──────────────────────────────"

# ── Safety check: must be run inside backend/ ───────────────────────────────
if [[ ! -f "package.json" ]] || ! grep -q '"name": "taskflow-api"' package.json 2>/dev/null; then
  echo -e "${RED}✗ This doesn't look like the backend folder.${RESET}"
  echo "  cd into backend/ first, then run this script."
  exit 1
fi

# ── Check active Node version ────────────────────────────────────────────────
NODE_VER=$(node --version 2>/dev/null || echo "none")
echo "Active Node version: $NODE_VER"

if [[ "$NODE_VER" != v20* ]]; then
  echo -e "${YELLOW}!  Warning: Node 20 LTS is recommended for this workshop.${RESET}"
  echo "   If you have nvm installed, run: nvm use 20"
  echo ""
  read -p "Continue anyway with $NODE_VER? [y/N] " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. Run 'nvm use 20' and try again."
    exit 1
  fi
fi

# ── Remove generated artefacts ──────────────────────────────────────────────
echo ""
echo "Removing generated files..."

for item in node_modules package-lock.json dist taskflow.db taskflow.db-shm taskflow.db-wal; do
  if [[ -e "$item" ]]; then
    rm -rf "$item"
    echo -e "  ${GREEN}✓${RESET} removed $item"
  else
    echo "  - $item (not present, skipped)"
  fi
done

# ── Clear npm cache for this project (optional but helps with stale builds) ──
echo ""
echo "Clearing npm cache..."
npm cache clean --force >/dev/null 2>&1 || true
echo -e "  ${GREEN}✓${RESET} npm cache cleared"

# ── Fresh install ─────────────────────────────────────────────────────────────
echo ""
echo "Running fresh npm install..."
echo "──────────────────────────────"
npm install

# ── Verify it worked ──────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────"
if [[ -d "node_modules/better-sqlite3" ]] && [[ -d "node_modules/.bin" ]]; then
  echo -e "${GREEN}${BOLD}✓ Reset complete. Dependencies installed successfully.${RESET}"
  echo ""
  echo "Next steps:"
  echo "  npm test       # should show 4 failures, 27 passing"
  echo "  npm run dev    # start the server on :3000"
else
  echo -e "${RED}${BOLD}✗ Install finished but node_modules looks incomplete.${RESET}"
  echo "  Review the npm output above for errors."
  exit 1
fi
