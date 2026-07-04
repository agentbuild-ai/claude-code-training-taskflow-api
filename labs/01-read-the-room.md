# Lab 1 — Read the room (30 min)

Get oriented. Work through Core first; move to Extension and Stretch if you finish early — they don't depend on each other, but they do get harder.

---

## Core

Open Claude Code in VS Code. Run this prompt:

> "Describe this codebase. What does it do, what are its dependencies, and what's broken?"

Watch the agent explore. Then run:

> "List every failing test and give me a one-line hypothesis for each failure."

**You're done when:** you have a shared picture of what's in the project and which tests fail, and you could explain both to someone who's never seen the repo.

---

## Extension

Pick one route (e.g. `POST /projects` or `PATCH /tasks/:id`) and map its data flow end to end, including how it interacts with `backend/src/middleware/errorHandler.ts` — the one real cross-cutting middleware in this codebase.

> "Trace exactly how an error thrown in `POST /projects` flows through to the client, file by file. Then show me the two things that would break if a route stopped following `errorHandler.ts`'s `next(err)` contract."

**You're done when:** you can draw (or narrate) the full request → handler → error → response path from memory, and you've verified it against the actual code rather than assumed it.

---

## Stretch

> "Write a one-page architecture note for a new engineer joining this project. Then go back and verify every single claim in it against the actual source — flag anything you wrote that isn't literally true."

This is harder than it sounds — the easy failure mode is writing something plausible-sounding and never checking it.

**You're done when:** the architecture note exists, and you have a marked-up list of what you got right vs. wrong on the first pass.
