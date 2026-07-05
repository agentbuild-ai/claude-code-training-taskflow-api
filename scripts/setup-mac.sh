#!/usr/bin/env bash
# =============================================================================
# TaskFlow — macOS environment setup
#
# Installs everything needed to run this project end-to-end: Homebrew, git,
# a working Node.js (18/20/22 — Angular 18's supported majors), jq (used in
# the README's example curl commands), and the npm dependencies for every
# app folder present in this checkout (backend/, frontend/, demo/managed-
# agents/ — whichever exist; not every branch has all three).
#
# Safe to re-run. Every step checks what's already there before installing,
# so an already-set-up machine just gets confirmed, not reinstalled.
#
# Usage: bash scripts/setup-mac.sh   (run from the repo root)
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

FAILURES=()

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; }
warn() { echo -e "  ${YELLOW}!${RESET} $1"; }
fail() { echo -e "  ${RED}✗${RESET} $1"; FAILURES+=("$1"); }

echo ""
echo -e "${BOLD}TaskFlow — macOS setup${RESET}"
echo "──────────────────────────────"

# ── Repo root sanity check ──────────────────────────────────────────────────
if [[ ! -f "README.md" ]] || [[ ! -d "backend" ]]; then
  echo -e "${RED}✗ This doesn't look like the taskflow-api repo root.${RESET}"
  echo "  cd into the repo root (the folder with README.md and backend/) and try again."
  exit 1
fi

# ── Homebrew ─────────────────────────────────────────────────────────────────
echo ""
echo "Checking Homebrew..."
if command -v brew &>/dev/null; then
  ok "Homebrew already installed ($(brew --version | head -1))"
else
  echo "  Installing Homebrew (you may be prompted for your password)..."
  if /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"; then
    # Apple Silicon Homebrew installs to /opt/homebrew, not on PATH by default in this shell
    if [[ -x /opt/homebrew/bin/brew ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    ok "Homebrew installed"
  else
    fail "Homebrew install failed — install manually from https://brew.sh, then re-run this script"
  fi
fi

# ── git ──────────────────────────────────────────────────────────────────────
echo ""
echo "Checking git..."
if command -v git &>/dev/null; then
  ok "git already installed ($(git --version))"
elif command -v brew &>/dev/null; then
  brew install git &>/dev/null && ok "git installed" || fail "git install failed"
else
  fail "git missing and Homebrew unavailable — install git manually"
fi

# ── Node.js (need major 18, 20, or 22 — Angular 18's supported majors) ───────
echo ""
echo "Checking Node.js..."

node_major() { node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/'; }

NEED_NODE=true
if command -v node &>/dev/null; then
  CURRENT_MAJOR="$(node_major)"
  if [[ "$CURRENT_MAJOR" == "18" || "$CURRENT_MAJOR" == "20" || "$CURRENT_MAJOR" == "22" ]]; then
    ok "Node.js $(node -v) already installed and compatible"
    NEED_NODE=false
  else
    warn "Node.js $(node -v) found, but this project needs major version 18, 20, or 22 — installing Node 20 via nvm"
  fi
else
  warn "Node.js not found — installing via nvm"
fi

if [[ "$NEED_NODE" == "true" ]]; then
  if [[ ! -s "$HOME/.nvm/nvm.sh" ]]; then
    echo "  Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash &>/dev/null
  fi
  # nvm is a shell function, not a binary — must be sourced, not just on PATH
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  if command -v nvm &>/dev/null; then
    nvm install 20 &>/dev/null && nvm alias default 20 &>/dev/null && nvm use 20 &>/dev/null
    if [[ "$(node_major)" == "20" ]]; then
      ok "Node.js $(node -v) installed via nvm"
    else
      fail "nvm ran but Node 20 isn't active — open a new terminal and run 'nvm use 20'"
    fi
  else
    fail "nvm install failed — install Node 18/20/22 manually from https://nodejs.org"
  fi
fi

# ── jq (used in the README's example curl commands) ──────────────────────────
echo ""
echo "Checking jq..."
if command -v jq &>/dev/null; then
  ok "jq already installed"
elif command -v brew &>/dev/null; then
  brew install jq &>/dev/null && ok "jq installed" || warn "jq install failed (optional — only used to pretty-print example curl output)"
else
  warn "jq not installed (optional — only used to pretty-print example curl output)"
fi

# ── App dependencies — only for folders that exist in this checkout ─────────
echo ""
echo "Installing app dependencies..."
for app in backend frontend demo/managed-agents; do
  if [[ -d "$app" && -f "$app/package.json" ]]; then
    echo "  $app/"
    if (cd "$app" && npm install --silent); then
      ok "$app dependencies installed"
    else
      fail "$app: npm install failed — see output above"
    fi
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────"
if [[ ${#FAILURES[@]} -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ Setup complete.${RESET}"
else
  echo -e "${YELLOW}${BOLD}⚠ Setup finished with ${#FAILURES[@]} issue(s):${RESET}"
  for f in "${FAILURES[@]}"; do
    echo -e "  ${RED}✗${RESET} $f"
  done
fi
echo ""
echo "Next steps:"
[[ -d backend ]] && echo "  cd backend  && npm test && npm run dev   # API on :3000"
[[ -d frontend ]] && echo "  cd frontend && npx ng serve              # UI on :4200"
[[ -d demo/managed-agents ]] && echo "  cd demo/managed-agents && cat README.md   # live-demo harness setup"

# Exit status reflects whether anything actually failed, not whichever
# optional "next steps" line happened to run last.
[[ ${#FAILURES[@]} -eq 0 ]]
