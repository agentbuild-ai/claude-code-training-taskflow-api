# Lab 2 — Build your CLAUDE.md (35 min)

The root `CLAUDE.md` in this repo is intentionally sparse. Run a task before changing anything, and notice the assumptions the agent makes without it.

**The task:** ask Claude to add `PATCH /projects/:id` (rename a project) to the backend. Don't tell it anything else — just the endpoint and what it should do. Note what it gets wrong or has to guess at (error-handling style, status codes, whether it writes a test, whether it matches the existing `tasks.ts` PATCH pattern).

---

## Core

Improve the root `CLAUDE.md`. Add:
- The stack and why each piece was chosen
- Conventions (naming, file layout, error handling pattern)
- What the test runner is and how to run it
- What NOT to touch (e.g. don't change test assertions)

Re-run the same task from before you made changes. Compare the outputs.

Then: pick **one** thing you just added that's actually about how *you* like to work, not about this project specifically (e.g. "always run tests before considering a task done," a formatting preference, a habit around commit messages). Move it out of the project `CLAUDE.md` and into your personal global one instead — `~/.claude/CLAUDE.md`.

**You're done when:** you can explain why every remaining line in the project `CLAUDE.md` is there, *and* why the one you moved belongs in your global file instead — what makes it personal rather than project-level.

---

## Extension

Add a `CLAUDE.md` inside **either** `backend/` or `frontend/` (your choice) with something specific to just that app — a convention, a gotcha, a pattern that doesn't apply to the other side of the repo.

Prove it's actually scoped: ask Claude a question while it's focused on the *other* app (the one without the new file) and confirm that guidance doesn't show up. Don't just assume the scoping works — check it.

Then write a `/review` skill that checks for common issues specific to this project (you'll extend this in Lab 5, so make it a real, useful checklist — not a placeholder).

**You're done when:** you've empirically confirmed the subdirectory file's scope, and your `/review` skill produces a report you'd actually trust.

---

## Stretch

Use `/context` to compare token cost: your original thin `CLAUDE.md` vs. your improved root version (and the subdirectory one, if you built it).

**You're done when:** you can state a concrete number-backed tradeoff — not "the rich one is better," but *how much* more it costs and whether that's worth it for this project's size.
