# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in `backend/`. It supplements the root `CLAUDE.md`, which orients across this API and the `frontend/` Angular app.

## Project overview

TaskFlow is a REST API for managing tasks across teams and projects (users → projects → tasks). It has no authentication — this is an internal-tool API. Stack: Node.js 20, TypeScript 5, Express 4, SQLite via `better-sqlite3`, Jest + Supertest for tests.

This is a workshop/demo project, not a production service — things like auth, pagination, and heavy input sanitization are intentionally out of scope rather than oversights.

## Commands

All commands below are run from inside `backend/`.

```bash
npm run dev              # start dev server with auto-restart (ts-node-dev), http://localhost:3000 (override with PORT)
npm test                 # run the full Jest suite (--runInBand — see Architecture for why)
npm run test:watch       # same, in watch mode
npx jest tests/tasks.test.ts              # run a single test file
npx jest tests/tasks.test.ts -t "name"    # run a single test by name substring
npm run typecheck        # tsc --noEmit
npm run build            # compile to dist/ (npm start runs the compiled output)
npm run lint             # eslint src tests --ext .ts
```

## Architecture

- **Split entry point**: `src/server.ts` calls `initSchema()` and starts listening; `src/app.ts` only builds the Express app (middleware + routes) and is exported on its own. Tests import `app.ts` directly and drive it with Supertest, without binding a port or starting the real server.
- **Single shared DB instance**: `src/db.ts` exports one module-level `better-sqlite3` `Database` object plus `initSchema()`. The path is `:memory:` when `NODE_ENV=test`, otherwise a WAL-mode file (`taskflow.db`) in `backend/`. Because every test file imports the same in-memory singleton, Jest is configured to run with `--runInBand` (see the `jest` block in `package.json`) — parallel workers would each get their own DB and break the shared-state assumptions tests rely on. `tests/helpers.ts` provides `resetDb()`/`seedUser()`/`seedProject()`/`seedTask()` against that same instance.
- **One router per resource**: `src/routes/{users,projects,tasks}.ts`, each mounted at its path prefix in `app.ts`. Handlers talk to SQLite directly via prepared statements — there's no ORM or repository/service layer to route around.
- **Error convention**: handlers build `new Error(message) as Error & { status: number }`, set `.status`, and call `next(err)` instead of throwing. `src/middleware/errorHandler.ts` is the single global handler (mounted last in `app.ts`) that converts any error into `{ error: message }` JSON, defaulting to 500 and logging server errors to the console. Follow this pattern for new endpoints rather than throwing or writing ad hoc `res.status().json()` error responses.
- **Schema/relationships** (mirrored as TS interfaces in `src/types.ts`): `users` 1—N `projects` via `owner_id` (cascade delete), `projects` 1—N `tasks` via `project_id` (cascade delete), `users` 0—N `tasks` via nullable `assignee_id` (set null on user delete). `tasks.status` is constrained to `'todo' | 'in_progress' | 'done'` both by a DB `CHECK` constraint and by re-validation in the route handlers. `tasks` also has `priority` (`'low'|'medium'|'high'`, default `'medium'`) and an optional `due_date`, plus a many-to-many `tags`/`task_tags` pair (cascade delete both ways) — all enforced via `PRAGMA foreign_keys = ON` in `db.ts`, since SQLite ignores declared `ON DELETE CASCADE`/`SET NULL` clauses without it.
- **No real migration framework — `initSchema()` is `CREATE TABLE IF NOT EXISTS` plus a small `ensureColumn` helper.** A brand-new table is a no-op to re-run against an existing one, which used to mean an old on-disk `backend/taskflow.db` silently kept its stale shape after a schema change (new columns, e.g.) — routes assuming the new schema would fail with "no such column" against it. `ensureColumn(table, column, definition)` closes that gap for **additive** changes: it checks `PRAGMA table_info` and runs `ALTER TABLE ... ADD COLUMN` only if the column is actually missing, so an old database self-upgrades in place (existing rows get backfilled with the column's default) the next time `initSchema()` runs — no manual deletion needed. This does **not** cover non-additive changes (renaming/retyping/dropping a column, or changing a `CHECK`/`FOREIGN KEY` on an existing column) — SQLite's `ALTER TABLE` can't do those in place; that class of change still needs `backend/taskflow.db*` deleted (or `scripts/reset.sh`) and starts fresh. Tests are unaffected either way (`:memory:` is recreated fresh every run).
