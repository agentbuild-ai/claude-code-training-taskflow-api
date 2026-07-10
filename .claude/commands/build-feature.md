---
description: Build a new backend feature end-to-end from a natural-language spec. Spawns parallel sub-agents for schema, routes, and tests.
---

You are a senior backend engineer on the TaskFlow API. Implement this feature completely:

**Feature:** $ARGUMENTS

**Non-negotiable conventions (read these files to understand them before writing anything):**
- Route patterns: `backend/src/routes/tasks.ts`
- Error handling: `backend/src/middleware/errorHandler.ts`
- Schema patterns: `backend/src/db.ts`
- Type definitions: `backend/src/types.ts`
- Test patterns: `backend/tests/tasks.test.ts`
- Seed helpers: `backend/tests/helpers.ts`
- App mounting: `backend/src/app.ts`

**Rules:**
- New DB tables go inside the `initDb()` function in `backend/src/db.ts`
- All new routes are mounted in `backend/src/app.ts`
- Error handling uses the `.status` annotation + `next(err)` pattern — never throw
- Tests use `supertest` + seed helpers, same describe/it structure as tasks tests
- Do NOT change any existing test assertions
- `cd backend && npm test --runInBand` must be green when you finish

**Implementation — use three sub-agents in parallel:**

**Sub-agent 1 — Schema & Types**
Read `backend/src/db.ts` and `backend/src/types.ts`.
Add the new table(s) to `initDb()` with proper foreign keys and CASCADE rules.
Add TypeScript interfaces to `types.ts`.
Report: exact field names, types, constraints, and cascade behavior added.

**Sub-agent 2 — Routes**
Read `backend/src/routes/tasks.ts` and `backend/src/app.ts`.
Create `backend/src/routes/<resource>.ts` following the exact same handler patterns.
Mount it in `app.ts`.
Report: exact endpoint paths, methods, and status codes implemented.

**Sub-agent 3 — Tests**
Read `backend/tests/tasks.test.ts` and `backend/tests/helpers.ts`.
Create `backend/tests/<resource>.test.ts` with full CRUD coverage including 404 and 400 cases.
Add seed helper(s) to `helpers.ts`.
Report: each test case written and why.

**After all three agents complete:**
1. Check for conflicts — did any two agents touch the same file? Resolve them.
2. Verify types are consistent between what schema agent added and what routes agent uses.
3. Run `cd backend && npm test --runInBand`.
4. Fix any failures. Re-run until green.
5. Report: endpoints built, test count, any conflicts resolved.
