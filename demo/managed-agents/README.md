# Managed Agents demo

A live demo for developers already fluent in this stack and already advanced
Claude Code CLI users: instead of using Claude Code locally, this kicks off
an Anthropic **Managed Agents** session — a separate, newer beta surface
where Anthropic runs the agent loop *and* hosts the container the agent's
tools execute in — and has it autonomously build three real features into
this repo, end to end, while you and the audience watch it happen live.

The session chains three rubric-graded **Outcomes** on one session:

1. Priority levels (`low`/`medium`/`high` on tasks, with filtering)
2. Due date filtering (`overdue=true`, `due_before=YYYY-MM-DD`)
3. A tagging system (many-to-many tags, add/remove/filter) — and a push to
   a new branch once this one is satisfied

Each outcome is graded against an explicit checklist (see `outcomes.ts`),
so the agent iterates on its own until it actually meets the bar, rather
than declaring victory after one pass.

## Prerequisites

1. **Push your current work first.** The agent clones from GitHub, not your
   local disk. Commit and push whatever branch you want it to start from
   (default: `completed_tasks`) before running the demo.
2. **`ANTHROPIC_API_KEY`** for an org with Managed Agents beta access.
3. **A GitHub Personal Access Token**, fine-grained, scoped to *only*
   `agentbuild-ai/claude-code-training-taskflow-api`, with **Contents: Read
   and write** (write is required — the final outcome pushes a branch).
4. **Do a private dry run before presenting live.** This is real, billed
   Opus 4.8 usage running three rubric-graded outcomes (up to 5 iterations
   each) with the full tool set. Realistic duration is likely 15–40+
   minutes depending on how much revision the tagging feature needs —
   budget your live segment accordingly (e.g. kick it off early and narrate
   other things while it runs).

## Setup

```bash
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY and GITHUB_TOKEN in .env

npm run setup
# copy the printed AGENT_ID and ENVIRONMENT_ID into .env
```

`npm run setup` only needs to be run once — the agent and environment are
persistent, reusable resources. Re-run it only if you want a fresh agent.

## Running the demo

```bash
npm run demo
```

Each run creates a brand-new session, so it's fully repeatable. The script
prints a Console trace URL immediately — open it in a browser alongside the
terminal so the audience can watch the agent's live trace (tool calls,
reasoning, file edits) while the terminal shows streamed progress text and
each outcome's pass/fail result.

When all three outcomes finish, fetch and inspect the agent's branch:

```bash
git fetch origin
git branch -r --sort=-committerdate | head -5   # find the agent's branch
git log origin/<branch-name>                    # see its real commits
```

That diff — a feature built and tested entirely by an autonomous, hosted
agent, on a real branch of a real repo — is the payoff moment.
