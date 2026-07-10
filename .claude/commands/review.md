---
description: Review the current branch diff using parallel security and performance specialists. Synthesizes findings into one report and explicitly resolves conflicts.
---

Review the code changes on the current branch for issues.

**Step 1 — Gather what's changed**

Run `git diff main -- backend/ frontend/` to get the diff under review.
If that returns nothing, run `git diff HEAD~1` instead.
Read the diff in full and store it — you will pass it to each sub-agent.

**Step 2 — Spawn two specialist sub-agents simultaneously using the Agent tool**

Spawn BOTH agents at the same time before waiting for either to complete. Pass the full diff text into each agent's prompt directly.

---

**Spawn Agent 1 with this exact prompt** (replace <DIFF> with the actual diff text):

```
You are a security specialist reviewing a code diff. Your job is to find security issues only — do not comment on performance, style, or correctness.

Here is the diff to review:
<DIFF>

For each finding, report:
- Title
- Severity: HIGH / MEDIUM / LOW  
- File + line reference
- Specific fix recommendation

Check for:
- SQL injection — are ALL database queries using prepared statements with ? placeholders? Any string concatenation into SQL is HIGH.
- Input validation gaps — required fields not checked, types not validated, enum values accepted without allowlist
- Error responses leaking internals — stack traces, SQL text, column names, or file paths in error JSON
- Missing foreign key validation — does the route verify the referenced resource exists before inserting?
- Unsafe patterns with better-sqlite3 — synchronous throws not caught, constraint errors not handled

Return ONLY a list of findings. Do not synthesize or make a verdict.
```

---

**Spawn Agent 2 with this exact prompt** (replace <DIFF> with the same diff text):

```
You are a performance specialist reviewing a code diff. Your job is to find performance issues only — do not comment on security, style, or correctness.

Here is the diff to review:
<DIFF>

For each finding, report:
- Title
- Severity: HIGH / MEDIUM / LOW
- File + line reference
- Specific fix recommendation

Check for:
- N+1 query patterns — any loop or map that executes a DB query per iteration
- Over-fetching — SELECT * where only specific columns are needed
- Missing index opportunities — columns used in WHERE clauses that are likely unindexed (foreign keys, status fields, email)
- Repeated prepare() calls inside handlers instead of at module level
- Large response payloads — returning nested or joined data the client doesn't need

Return ONLY a list of findings. Do not synthesize or make a verdict.
```

---

**Step 3 — Wait for both agents to complete, then synthesize**

Once both agents have returned their findings, merge them into one report:

1. **Conflicts**: If the security finding and performance finding point in opposite directions on the same code — surface it explicitly. Do not silently drop either finding.

2. **Resolution**: For each conflict, pick a side or a middle path and state the reason. Do not just describe the tradeoff.

3. **Output this exact structure:**

## Security Findings

| Severity | Finding | File | Recommendation |
|---|---|---|---|
| ... | ... | ... | ... |

## Performance Findings

| Severity | Finding | File | Recommendation |
|---|---|---|---|
| ... | ... | ... | ... |

## Conflicts & Resolutions

For each conflict:
> **Conflict:** [what the two specialists disagree on]
> **Decision:** [what to do]
> **Reason:** [why this side wins or why the compromise works]

## Verdict

**READY TO MERGE** / **NEEDS CHANGES** / **BLOCKING ISSUES**

One paragraph summary of the most important findings and what must be addressed before this ships.
