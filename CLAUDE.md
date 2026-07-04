# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

TaskFlow is a task management demo split into two independent apps in one repo:

- **`backend/`** — an Express + TypeScript + SQLite REST API for managing users, projects, and tasks. See `backend/CLAUDE.md` for its commands and architecture.
- **`frontend/`** — an Angular 18 single-page app that consumes the API. See `frontend/CLAUDE.md` for its commands and architecture.

There is also **`demo/managed-agents/`** — a standalone script harness (unrelated to the app itself) that kicks off an Anthropic Managed Agents session to autonomously build features into this repo live, for presentations. See `demo/managed-agents/README.md`.

There is no root-level `package.json` — each app has its own dependencies, scripts, and lockfile, and is run from within its own folder. Read the CLAUDE.md inside whichever folder you're working in; this file only orients between the two.

This is a workshop/demo project, not a production service — things like auth, pagination, and heavy input sanitization are intentionally out of scope in the backend rather than oversights.

**This branch (`reference-solution`) is the completed reference solution for the taskflow-api workshop.** It's built from `completed_tasks` with all 3 intentionally-planted bugs fixed and all 3 candidate features (task priority levels, due-date filtering, and tagging) implemented end-to-end — backend, frontend, and tests. Workshop participants clone the separate `scratch-building` branch instead, which still has the bugs and none of the features; `completed_tasks` is a different branch again — scaffolding-only, used as the base for the `demo/managed-agents/` live-demo tool, deliberately still missing these bugs/features so that demo has real work to show.

## Running both together

```bash
# Terminal 1 — API on http://localhost:3000
cd backend && npm install && npm run dev

# Terminal 2 — UI on http://localhost:4200
cd frontend && npm install && npx ng serve
```

The backend enables CORS so the frontend can call it directly across ports.

## Repo layout

```
taskflow-api/
├── backend/     # Express API — src/, tests/, own package.json (see backend/CLAUDE.md)
├── frontend/    # Angular UI — src/app/, own package.json (see frontend/CLAUDE.md)
├── demo/managed-agents/  # Live-demo harness using the Anthropic Managed Agents API (see its README)
├── scripts/     # Repo-wide maintenance scripts (e.g. reset.sh — full backend reinstall)
└── .claude/     # Claude Code project config (slash commands, etc.)
```
