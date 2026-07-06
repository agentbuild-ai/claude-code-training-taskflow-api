# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in `backend/`. It supplements the root `CLAUDE.md`, which orients across this API and the `frontend/` Angular app.

## Project overview

TaskFlow is a REST API for managing tasks across teams and projects (users → projects → tasks). It has no authentication — this is an internal-tool API. Stack: Node.js 20, TypeScript 5, Express 4, SQLite via `better-sqlite3`, Jest + Supertest for tests.

**Why this stack:** Express for minimal, unopinionated routing, so the error-handling middleware pattern below stays visible instead of being hidden behind a bigger framework's own conventions. SQLite via `better-sqlite3` so there's no separate database server to install for a workshop, and its synchronous API keeps handlers readable without async/await ceremony. TypeScript for type safety without a heavier build pipeline on top of Express.

This is a workshop/demo project, not a production service — things like auth, pagination, and heavy input sanitization are intentionally out of scope rather than oversights.

**Config:** no `.env` file and no config-loading library (`dotenv` etc.) — don't go looking for one. The only environment variables actually read are `PORT` (`server.ts`, defaults to `3000`) and `NODE_ENV` (`db.ts`, `'test'` switches to an in-memory DB).

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
- **Single shared DB instance**: `src/db.ts` exports one module-level `better-sqlite3` `Database` object plus `initSchema()`. The path is `:memory:` when `NODE_ENV=test`, otherwise a WAL-mode file (`taskflow.db`) in `backend/`. Because every test file imports the same in-memory singleton, the `test`/`test:watch` npm scripts pass `--runInBand` — parallel workers would each get their own DB and break the shared-state assumptions tests rely on. (The `"runInBand": true` entry inside the `jest` config block in `package.json` is *not* a real Jest config option — Jest warns and ignores it; the CLI flag on the scripts is what actually enforces this.) `tests/helpers.ts` provides `resetDb()`/`seedUser()`/`seedProject()`/`seedTask()` against that same instance.
- **One router per resource**: `src/routes/{users,projects,tasks}.ts`, each mounted at its path prefix in `app.ts`. Handlers talk to SQLite directly via prepared statements — there's no ORM or repository/service layer to route around.
- **Adding a new resource follows one pattern**: a router at `src/routes/<name>.ts` (mounted in `app.ts`), a matching `tests/<name>.test.ts`, and a `seed<Name>()` helper added to `tests/helpers.ts` alongside `seedUser`/`seedProject`/`seedTask`. Follow this shape rather than improvising a different file layout or test setup.
- **Error convention**: handlers build `new Error(message) as Error & { status: number }`, set `.status`, and call `next(err)` instead of throwing. `src/middleware/errorHandler.ts` is the single global handler (mounted last in `app.ts`) that converts any error into `{ error: message }` JSON, defaulting to 500 and logging server errors to the console. Follow this pattern for new endpoints rather than throwing or writing ad hoc `res.status().json()` error responses.
- **Schema/relationships** (mirrored as TS interfaces in `src/types.ts`): `users` 1—N `projects` via `owner_id` (cascade delete), `projects` 1—N `tasks` via `project_id` (cascade delete), `users` 0—N `tasks` via nullable `assignee_id` (set null on user delete). `tasks.status` is constrained to `'todo' | 'in_progress' | 'done'` both by a DB `CHECK` constraint and by re-validation in the route handlers.
