# Lab 5 — Sub-agents in parallel (35 min)

---

## Core

Build a `/review` skill that forks two sub-agents simultaneously:
- One checks for security issues
- One checks for performance issues

Each sub-agent receives the same codebase but a different focus. The orchestrator synthesises their findings into one report.

Invoke the skill. Watch both agents run. Read the combined output.

**Discussion question:** when does this pattern earn its complexity? When is a single agent run cleaner?

**You're done when:** you've run it, read the synthesized output, and have an answer to the discussion question you could defend.

---

## Extension

Add a **third specialist** to the fork — your choice of focus (correctness, accessibility, maintainability, whatever you think is missing).

Now make the orchestrator do something harder than concatenating three reports: when two specialists give **conflicting** recommendations (e.g. security wants stricter validation that performance flags as a hot-path cost), have the orchestrator explicitly surface the conflict and resolve it — not just report it, actually decide and say why.

If your three specialists happen not to disagree on the first try, that's a signal to pick a section of the code (or a hypothetical change) more likely to produce a real tradeoff, not a signal that you're done.

**You're done when:** you've seen at least one genuine conflict get surfaced and resolved, with a stated reason for the resolution.

---

## Stretch

Run the same underlying question as a **stochastic-consensus fan-out** instead of a specialist fork: spin up N (try 5) identical agents with the *same* prompt and the *same* focus — no division of labor — and compare the spread of their independent findings.

**You're done when:** you can articulate, concretely, what consensus fan-out is good for that specialist-fork isn't (and vice versa) — where does agreement across N identical runs tell you something specialization can't, and where does specialization catch something consensus would miss entirely?
