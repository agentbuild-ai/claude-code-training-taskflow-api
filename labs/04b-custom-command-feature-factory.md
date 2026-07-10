# Lab 4b — Custom Commands as Feature Factories (45 min)

> **Expert track.** This lab introduces custom slash commands as team-shared, version-controlled AI workflows — used here to orchestrate parallel sub-agents that build a complete backend feature from a single natural-language description.

---

## Background: What Custom Commands Are

Custom commands live in `.claude/commands/<name>.md`. Any file there becomes `/<name>` in Claude Code sessions, available to everyone who checks out the repo. The file body is the prompt template; `$ARGUMENTS` is replaced with whatever the user types after the command name.

Unlike personal skills in `~/.claude/`, custom commands are:
- **Repo-scoped** — checked in, versioned, PR-reviewed like any other file
- **Team-wide** — every engineer gets them automatically on `git pull`
- **Composable** — they can spawn sub-agents, enforce conventions, reference real codebase files

This one is already wired up in `.claude/commands/build-feature.md`. Open it before you proceed — read the whole thing, especially how it references your actual source files (`routes/tasks.ts`, `tests/tasks.test.ts`, etc.) as living examples rather than hardcoded templates.

---

## Core — Run the Feature Factory (20 min)

### Step 1: Start a fresh Claude Code session

Custom commands load at session start. Open a new session (reload the VS Code window, or start `claude` in a fresh terminal).

Confirm the command is available by typing `/build` — you should see `build-feature` in the autocomplete.

### Step 2: Run it

```
/build-feature add task comments: users can post text comments on tasks. Each comment has a body (required) and an optional author_id. Comments are nested under tasks — list and create via /tasks/:id/comments, delete via /comments/:id.
```

Let it run without intervening.

### Step 3: Watch what happens

Specifically watch for:
- Three sub-agents spawning: schema/types, routes, tests
- Each agent reading the *real* pattern files before writing anything
- The PostToolUse hook (from Lab 3) firing test runs after each file change
- The coordinator reconciling any conflicts before the final `npm test` run

### Step 4: Verify

```bash
cd backend && npm test
```

Then:

```bash
git diff --stat
```

You should see 6 files changed/created: `db.ts`, `types.ts`, `routes/comments.ts`, `app.ts`, `tests/comments.test.ts`, `tests/helpers.ts`.

**You're done when:** tests are green and `git diff --stat` shows those 6 files — from one slash command.

> **The "Aha!":** This is not a code generator running templates. Claude read `tasks.ts` and replicated its exact error handling pattern, SQL style, and status codes — in three files simultaneously. No template could do that for an unfamiliar codebase.

---

## Extension — Constraint Engineering (15 min)

The power of a custom command over a raw prompt is that constraints are *permanent* — they apply every time the command runs, for every team member, without being re-stated.

### Step 1: Reset

```bash
git checkout -- backend/
```

### Step 2: Add a TDD constraint

Open `.claude/commands/build-feature.md`. Find the "Implementation" section and add this rule before the sub-agent list:

> **Ordering constraint:** Sub-agent 3 (Tests) must run FIRST and confirm the tests FAIL before Sub-agents 1 and 2 implement anything. This enforces test-driven development — red before green.

### Step 3: Re-run the same prompt

```
/build-feature add task comments: users can post text comments on tasks. Each comment has a body (required) and an optional author_id. Comments are nested under tasks — list and create via /tasks/:id/comments, delete via /comments/:id.
```

Compare to the first run:
- Did the ordering change?
- Did the final diff look different in quality or coverage?
- Did having failing tests first change what the routes agent implemented?

**You're done when:** you can name one concrete thing the TDD constraint changed — or explain why it didn't, and what that tells you about how ordering constraints propagate to parallel agents.

---

## Stretch — Headless Pipeline (10 min)

The same command that runs interactively also runs headlessly. No code changes needed:

```bash
claude -p "$(sed 's/\$ARGUMENTS/add task priority: high, medium, or low with default medium. Tasks must be filterable by priority./' .claude/commands/build-feature.md)"
```

This pipes the resolved command directly into `claude -p` — the entire parallel sub-agent workflow runs with no UI, no prompts, no intervention.

After it finishes: `cd backend && npm test`

**Questions to sit with:**
- What would you add to the command file to make this pipeline also commit, branch, and open a PR?
- How would you wire this into a GitHub Actions workflow triggered by a feature-request issue label?

**You're done when:** the headless run completes, tests are green, and you've written down one concrete next step for wiring this into your team's actual workflow.

---

## What You Can Take Back

Build a `/build-feature` command for your own codebase. The key ingredients:

| Ingredient | What it does |
|---|---|
| Reference real example files | Claude reads your actual patterns — no templates to maintain |
| Explicit convention rules | Constraints in the command file apply to every future run |
| Parallel sub-agents per layer | Schema, routes, tests work simultaneously — not sequentially |
| `npm test` as the exit gate | The command can't declare success until the test suite is green |

The command becomes a living document. As your codebase evolves, update `.claude/commands/build-feature.md` and every future `/build-feature` run picks up the new standard — automatically, for the whole team.
