# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

TaskFlow is a task management demo split into two independent apps in one repo:

- **`backend/`** — an Express + TypeScript + SQLite REST API for managing users, projects, and tasks. See `backend/CLAUDE.md` for its commands and architecture.
- **`frontend/`** — an Angular 18 single-page app that consumes the API. See `frontend/CLAUDE.md` for its commands and architecture.

There is also **`demo/managed-agents/`** — a standalone script harness (unrelated to the app itself) that kicks off an Anthropic Managed Agents session to autonomously build features into this repo live, for presentations. See `demo/managed-agents/README.md`.

There is no root-level `package.json` — each app has its own dependencies, scripts, and lockfile, and is run from within its own folder. Read the CLAUDE.md inside whichever folder you're working in; this file only orients between the two.

This is a workshop/demo project, not a production service — things like auth, pagination, and heavy input sanitization are intentionally out of scope in the backend rather than oversights.

**This branch (`completed_tasks`) is a facilitator/demo base, not the workshop starter and not the completed reference.** It has the scaffolding above (the backend/frontend split, `demo/managed-agents/`) but the backend's 3 intentionally-planted bugs are still present and unfixed, on purpose — the Managed Agents demo depends on there being real, unbuilt work to show live. Workshop participants clone `scratch-building` (or `workshop-participants`) instead, which has none of this branch's scaffolding. The actual bugs-fixed, features-built reference lives on the `reference-solution` branch. See `FACILITATOR.md` for facilitator-only notes (field reports logistics, timing, suggested exercise regressions) — it deliberately isn't distributed to participants.

## Running both together

Quick setup (installs git/Node/jq if missing, runs `npm install` for both apps — safe to re-run):

```bash
bash scripts/setup-mac.sh                                              # macOS
powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1      # Windows
```

Then, in two terminals:

```bash
# Terminal 1 — API on http://localhost:3000
cd backend && npm run dev

# Terminal 2 — UI on http://localhost:4200
cd frontend && npx ng serve
```

The backend enables CORS so the frontend can call it directly across ports. `scripts/verify-setup-mac.sh` / `verify-setup-windows.ps1` are read-only checks if you want to confirm the toolchain without reinstalling anything.

## Repo layout

```
taskflow-api/
├── backend/     # Express API — src/, tests/, own package.json (see backend/CLAUDE.md)
├── frontend/    # Angular UI — src/app/, own package.json (see frontend/CLAUDE.md)
├── demo/managed-agents/  # Live-demo harness using the Anthropic Managed Agents API (see its README)
├── labs/00-pre-req-installation.md  # Just the pre-req setup guide, copied here for convenience — the full lab set lives on scratch-building
├── scripts/     # setup-mac.sh/setup-windows.ps1 (install), verify-setup-mac.sh/verify-setup-windows.ps1 (check-only), reset.sh (full backend reinstall)
├── FACILITATOR.md  # Facilitator-only notes — not on the participant branches
└── .claude/     # Claude Code project config (slash commands, etc.)
```
