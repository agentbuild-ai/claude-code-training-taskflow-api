# Workshop Guide — TaskFlow API

Five labs, each with a **Core / Extension / Stretch** structure. Do Core first. If you finish early, move on to Extension, then Stretch — don't wait for the group. Extension and Stretch get progressively harder and more open-ended.

Work through the labs in order — each one builds on artifacts from the last (your `CLAUDE.md`, your `/review` skill).

---

## Schedule

| Time | Lab |
|---|---|
| 30 min | [Lab 1 — Read the room](labs/01-read-the-room.md) |
| 35 min | [Lab 2 — Build your CLAUDE.md](labs/02-build-your-claude-md.md) |
| 35 min | [Lab 3 — Debug the test suite](labs/03-debug-the-test-suite.md) |
| — | Lunch |
| 15 min | Field reports — short demos from a few of you, arranged in advance |
| 60 min | [Lab 4 — Team-level workflow design](labs/04-team-workflow-design.md) |
| 35 min | [Lab 5 — Sub-agents in parallel](labs/05-sub-agents-in-parallel.md) |

---

## Useful commands

```bash
# Backend (cd backend first)
npm run dev        # Start the server (port 3000)
npm test           # Run the full test suite
npm run typecheck  # Type-check without building
npm run build      # Compile to /dist
npm run lint       # Lint src and tests

# Frontend (cd frontend first)
npx ng serve       # Start the dev server (port 4200)
```
