# Lab 3b — Hooks & Autonomous Feedback Loops (45 min)

> **Expert track.** This lab assumes you already know CLAUDE.md, sub-agents, and batch mode. It introduces **Hooks** — the most powerful underdiscovered Claude Code feature — using the same broken test suite as the launchpad.

---

## Background: What Hooks Actually Do

Hooks are shell commands wired into Claude's tool-call lifecycle via `.claude/settings.local.json`. There are four lifecycle events:

| Event | Fires | When |
|---|---|---|
| `PreToolUse` | Before a tool runs | Can block the tool by exiting non-zero |
| `PostToolUse` | After a tool runs | **stdout is injected into Claude's context** |
| `Notification` | When Claude sends a notification | Side-effect only |
| `Stop` | When Claude finishes its turn | Side-effect only |

The critical insight: **PostToolUse hooks are not fire-and-forget.** Their output becomes part of Claude's next reasoning step. This turns Claude's agentic loop into a closed feedback control system.

---

## Core — PostToolUse Feedback Loop (15 min)

### Step 1: Enable the hook

The hook is already configured in `.claude/settings.local.json` for this workshop. To understand what it does:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd /path/to/backend && npm test --runInBand 2>&1 | tail -40"
          }
        ]
      }
    ]
  }
}
```

Every time Claude edits or writes a file, the test suite runs automatically. The last 40 lines of output land in Claude's context before it takes its next action.

### Step 2: Run the test-fixing prompt

Open a new Claude Code session and run:

> "Fix all failing tests in backend/tests/. Don't change test assertions — fix the implementation."

Let it run to completion without intervening.

### Step 3: Count what you see

Watch the transcript closely. You should notice:
- Claude edits a file
- Test output appears **automatically** in context — Claude did not call `npm test`
- Claude reads the results and plans the next edit directly

Compare that to the traditional loop: Edit → `Bash(npm test)` → read output → Edit. One entire tool-call round-trip has been eliminated per cycle.

**You're done when:** `cd backend && npm test` is all green, and you can confirm Claude never called `npm test` explicitly — the hook did it every time.

> **The "Aha":** Hooks don't just automate side effects. They inject information into Claude's decision-making loop. That's a fundamentally different capability.

---

## Extension — PreToolUse Guardrails (15 min)

### What's wired up

The same `settings.local.json` also includes a `PreToolUse` hook on all Bash calls:

```bash
# Logs every Bash command with timestamp:
echo "[$(date -u)] $CLAUDE_TOOL_INPUT" >> .claude/audit.log

# Blocks git push/commit and explains why:
if echo "$CLAUDE_TOOL_INPUT" | grep -qE 'git push|git commit'; then
  echo 'BLOCKED: git push/commit requires human review.' >&2
  exit 1
fi
```

### Step 1: Trigger the guardrail

Once your tests are passing, ask Claude:

> "The tests are all green. Commit and push the fixes."

Watch what happens. Claude attempts `git commit`, the hook fires, exits with code 1, and Claude receives the error message. It cannot proceed — so it pivots to describing the change and asking you to commit manually.

### Step 2: Inspect the audit log

```bash
cat .claude/audit.log
```

Every Bash command Claude ran during the session is timestamped there — a complete audit trail, with no changes to CLAUDE.md or any prompt instructions.

**You're done when:** you can show the audit log AND confirm Claude could not push without you intervening.

> **Why this matters for teams:** PreToolUse hooks are policy enforcement that lives in config, not in prompts. Claude cannot be prompted around them. This is the pattern for enterprise guardrails — branch protection, approval gates, compliance logging.

---

## Stretch — MCP + Live Database (15 min)

### What MCP adds

MCP (Model Context Protocol) lets Claude connect to external servers that expose tools — databases, APIs, file systems. The `@modelcontextprotocol/server-sqlite` server is configured in `settings.local.json`:

```json
{
  "mcpServers": {
    "taskflow-db": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite", "/path/to/taskflow.db"]
    }
  }
}
```

Claude gets SQL tools (`query`, `execute`, `list_tables`) pointed at the live database.

### Step 1: Start a fresh session

MCP servers load at session start. Open a new Claude Code window or restart the session.

Confirm the tools are available — you should see `mcp__taskflow-db__*` in Claude's tool list when it reasons.

### Step 2: Run a live verification prompt

> "The backend CLAUDE.md says cascade delete is configured so deleting a user also deletes their tasks. Verify this is true by checking both the schema and live data. Then insert a test user, a test task assigned to them, delete the user, and confirm the task is gone."

Watch Claude:
1. Query the schema directly — not read `db.ts`
2. Insert real rows into the live database
3. Delete the user
4. Verify the task was cascaded away

### Step 3: Compare to code-only reasoning

Without MCP, Claude would read `db.ts` and tell you what *should* happen. With MCP, Claude *executes* the behavior and reports what *did* happen. That's the difference between static analysis and live system reasoning.

**You're done when:** the transcript shows `mcp__taskflow-db__query` (or equivalent) tool calls, and Claude has verified cascade delete against actual database rows — not just source code.

> **The generalization:** Any data source with an MCP server — Postgres, REST APIs, GraphQL endpoints — becomes part of Claude's reasoning context. This is what "AI-native development" looks like at the tooling level.

---

## What You Can Take Back to Your Team

| Pattern | What to wire up | Immediate use case |
|---|---|---|
| PostToolUse feedback | Run your test suite / linter after Edit | Tighter agentic loops on any codebase |
| PreToolUse guardrail | Block destructive commands, require human approval | Branch protection, prod safety, audit compliance |
| Audit log | Log all Bash calls to a file | SOC 2 / compliance trail for AI-assisted changes |
| MCP server | Connect to your database / internal APIs | Claude reasons over live system state, not just code |
