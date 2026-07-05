#!/usr/bin/env bash
# =============================================================================
# TaskFlow — macOS environment verification
#
# Read-only: never installs or changes anything. Confirms that everything
# scripts/setup-mac.sh was supposed to set up is actually present and
# working -- run this any time you want to check a machine's state without
# re-running the installer (days later, on someone else's laptop, in CI).
#
# Deliberately does NOT run `npm test`: on scratch-building/workshop-
# participants, 4 tests are intentionally broken as part of the workshop --
# that's an application bug, not an environment problem, so it must not
# show up as a verification failure here.
#
# Usage: bash scripts/verify-setup-mac.sh   (run from the repo root)
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

FAILURES=()
WARNINGS=()

pass() { echo -e "  ${GREEN}✓${RESET} $1"; }
warn() { echo -e "  ${YELLOW}!${RESET} $1"; WARNINGS+=("$1"); }
fail() { echo -e "  ${RED}✗${RESET} $1"; FAILURES+=("$1"); }

echo ""
echo -e "${BOLD}TaskFlow — macOS setup verification${RESET}"
echo "──────────────────────────────"

# ── Repo root sanity check ──────────────────────────────────────────────────
if [[ ! -f "README.md" ]] || [[ ! -d "backend" ]]; then
  echo -e "${RED}✗ This doesn't look like the taskflow-api repo root.${RESET}"
  echo "  cd into the repo root (the folder with README.md and backend/) and try again."
  exit 1
fi

# ── Toolchain ────────────────────────────────────────────────────────────────
echo ""
echo "Toolchain"

if command -v brew &>/dev/null; then
  pass "Homebrew: $(brew --version | head -1)"
else
  warn "Homebrew not found (only needed if you want setup-mac.sh to install things for you)"
fi

if command -v git &>/dev/null; then
  pass "git: $(git --version)"
else
  fail "git not found"
fi

if command -v node &>/dev/null; then
  NODE_VERSION="$(node -v)"
  NODE_MAJOR="$(echo "$NODE_VERSION" | sed -E 's/^v([0-9]+).*/\1/')"
  if [[ "$NODE_MAJOR" == "18" || "$NODE_MAJOR" == "20" || "$NODE_MAJOR" == "22" ]]; then
    pass "Node.js: $NODE_VERSION (compatible)"
  else
    fail "Node.js: $NODE_VERSION — major version $NODE_MAJOR is not 18, 20, or 22 (Angular 18's supported majors)"
  fi
else
  fail "Node.js not found"
fi

if command -v npm &>/dev/null; then
  pass "npm: $(npm -v)"
else
  fail "npm not found"
fi

if command -v jq &>/dev/null; then
  pass "jq: $(jq --version)"
else
  warn "jq not found (optional — only used to pretty-print example curl output)"
fi

# ── Per-app dependency check ─────────────────────────────────────────────────
# For each app folder that exists, confirm node_modules exists AND actually
# contains every direct dependency/devDependency listed in package.json --
# catches a partial/interrupted install that a bare "does node_modules exist"
# check would miss.
check_app() {
  local app="$1"
  echo ""
  echo "$app/"

  if [[ ! -f "$app/package.json" ]]; then
    warn "$app: no package.json — skipping (not part of this checkout)"
    return
  fi

  if [[ ! -d "$app/node_modules" ]]; then
    fail "$app: node_modules missing — run the setup script or 'npm install' in $app/"
    return
  fi
  pass "$app: node_modules present"

  local missing=()
  while IFS= read -r dep; do
    [[ -z "$dep" ]] && continue
    if [[ ! -e "$app/node_modules/$dep" ]]; then
      missing+=("$dep")
    fi
  done < <(node -e "
    const pkg = require('./$app/package.json');
    Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).forEach(d => console.log(d));
  " 2>/dev/null)

  if [[ ${#missing[@]} -eq 0 ]]; then
    pass "$app: all declared dependencies are present in node_modules"
  else
    fail "$app: ${#missing[@]} declared dependencies missing from node_modules (${missing[*]:0:5}$([[ ${#missing[@]} -gt 5 ]] && echo ' ...'))"
  fi

  # Typecheck if the app has one — fast, non-mutating, and the strongest
  # signal that the installed toolchain actually works together.
  if [[ "$app" == "frontend" ]] && [[ -f "$app/tsconfig.app.json" ]]; then
    if (cd "$app" && npx tsc --noEmit -p tsconfig.app.json) &>/dev/null; then
      pass "$app: typecheck passes"
    else
      fail "$app: typecheck failed — run 'npx tsc --noEmit -p tsconfig.app.json' in $app/ to see errors"
    fi
  elif grep -q '"typecheck"' "$app/package.json" 2>/dev/null; then
    if (cd "$app" && npm run typecheck --silent) &>/dev/null; then
      pass "$app: typecheck passes"
    else
      fail "$app: typecheck failed — run 'npm run typecheck' in $app/ to see errors"
    fi
  fi
}

for app in backend frontend demo/managed-agents; do
  [[ -d "$app" ]] && check_app "$app"
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "──────────────────────────────"
if [[ ${#FAILURES[@]} -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}✓ All checks passed.${RESET}"
  [[ ${#WARNINGS[@]} -gt 0 ]] && echo -e "${YELLOW}  (${#WARNINGS[@]} non-blocking warning(s) above.)${RESET}"
else
  echo -e "${RED}${BOLD}✗ ${#FAILURES[@]} check(s) failed:${RESET}"
  for f in "${FAILURES[@]}"; do
    echo -e "  ${RED}✗${RESET} $f"
  done
  echo ""
  echo "Run scripts/setup-mac.sh to fix most of these."
fi

[[ ${#FAILURES[@]} -eq 0 ]]
