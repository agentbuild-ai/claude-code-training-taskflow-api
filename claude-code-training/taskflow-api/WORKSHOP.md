# Workshop Guide — TaskFlow API

Work through the exercises below in order. Each one builds on the last.

---

## Exercise 1 — Read the room (25 min)

Open Claude Code in VS Code. Run this prompt:

> "Describe this codebase. What does it do, what are its dependencies, and what's broken?"

Watch the agent explore. Then run:

> "List every failing test and give me a one-line hypothesis for each failure."

**You're done when:** you have a shared picture of what's in the project and which tests fail.

---

## Exercise 2 — Build your CLAUDE.md (30 min)

The `CLAUDE.md` in this repo is intentionally sparse. Run a task. Notice the assumptions the agent makes.

Now improve it. Add:
- The stack and why each piece was chosen
- Conventions (naming, file layout, error handling pattern)
- What the test runner is and how to run it
- What NOT to touch (e.g. don't change test assertions)

Re-run the same task. Compare the outputs.

Then write a `/review` skill that checks for common issues specific to this project.

**You're done when:** you can explain why every line in your CLAUDE.md is there.

---

## Exercise 3 — Fix the test suite (30 min)

Run this single prompt:

> "Fix all failing tests in /tests/. Don't change test assertions — fix the implementation."

Let it run without intervening. Watch it plan, edit files, run tests, and iterate.

If it gets stuck, give it one clarifying prompt.

When tests pass: review every change it made. Anything surprising?

**You're done when:** `npm test` is all green.

---

## Exercise 4 — Build a feature end-to-end (55 min)

Pick one of the three missing features below. Write a one-paragraph spec in plain English. Then run one prompt:

> "Implement this feature. Write the endpoint, the model changes, the tests. Update CLAUDE.md if anything changes about how the project works."

Step back. Do not help. Let it run.

**Feature options:**

**A — Priority levels**
Tasks should have a priority: `low`, `medium`, or `high`. Add the field, expose it in the API, support filtering by priority (`GET /tasks?priority=high`), and validate that only valid values are accepted.

**B — Due date filtering**
Tasks should have an optional `due_date` (ISO 8601). Support `GET /tasks?overdue=true` and `GET /tasks?due_before=YYYY-MM-DD`. Handle tasks with no due date gracefully.

**C — Tagging system**
Tasks should support free-form tags. Add a `tags` table (many-to-many with tasks). Support adding and removing tags via `POST /tasks/:id/tags` and `DELETE /tasks/:id/tags/:tag`. Support filtering by tag: `GET /tasks?tag=urgent`.

**You're done when:** the feature works, tests pass, and you've reviewed every file the agent changed.

---

## Exercise 5 — Sub-agents in parallel (35 min)

Build a `/review` skill that forks two sub-agents simultaneously:
- One checks for security issues
- One checks for performance issues

Each sub-agent receives the same codebase but a different focus. The orchestrator synthesises their findings.

Invoke the skill. Watch both agents run. Read the combined output.

**Discussion question:** when does this pattern earn its complexity? When is a single agent run cleaner?

**Extension:** write a `/deploy-check` skill that uses an Explore sub-agent to scan for hardcoded credentials before any deployment task.

---

## Useful commands

```bash
npm run dev        # Start the server (port 3000)
npm test           # Run the full test suite
npm run typecheck  # Type-check without building
npm run build      # Compile to /dist
npm run lint       # Lint src and tests
```
