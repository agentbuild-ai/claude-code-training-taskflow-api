# Facilitator notes — TaskFlow workshop

Not for participants. Participant-facing lab guides live in `labs/` on the `scratch-building` branch — this file only holds what a facilitator needs and participants don't.

---

## Day timing

| Time | Segment |
|---|---|
| 30 min | Lab 1 — Read the room |
| 35 min | Lab 2 — Build your CLAUDE.md |
| 35 min | Lab 3 — Debug the test suite |
| — | Lunch |
| 15 min | Field Reports |
| 60 min | Lab 4 — Team-level workflow design |
| 35 min | Lab 5 — Sub-agents in parallel |

---

## Field Reports (15 min, after lunch, before Lab 4)

**Action item — do this before the day, not on it:** line up 3 short demos from advanced attendees in advance. Don't leave this to "does anyone want to volunteer?" on the day — it needs willing presenters and working demos ready to go.

Brief for presenters: a real problem they hit with Claude Code (in this workshop or elsewhere) and what they actually did about it. ~4–5 minutes each, then 2–3 minutes of questions. The goal is peer-to-peer signal from people at the same skill level as the room, not another facilitator-led segment.

---

## Lab 3 Stretch — suggested regressions

Participants introduce a subtle regression on purpose, then run their Lab 2 `/review` skill against it. If someone asks for a starting idea rather than inventing their own, offer one of these (rotate which one you suggest so the room doesn't all plant the same bug):

- Reintroduce an inner join somewhere the code was just fixed to use a left join (mirrors the original planted bug, but relocated).
- Flip a comparison operator in a date or numeric filter (`<` → `<=`, or vice versa) — subtle off-by-one behavior that's easy to miss on casual reading.
- Drop an input-trimming or normalization call (e.g. stop trimming whitespace before a uniqueness check) — produces intermittent, data-dependent failures rather than a clean break.
- Swap a `next(err)` for a direct `res.status(500).json(...)` in one handler — breaks the project's own error-handling convention in a way a generic reviewer might not catch unless it actually knows that convention (which is the point — it tests whether their `/review` skill encodes project-specific rules or just generic ones).

---

## Lab 5 Extension — if specialists don't disagree

The exercise asks participants to make three specialists (their original two plus a new third) produce a real, resolved conflict — not just three non-overlapping reports. Some groups' first attempt won't produce genuine disagreement, and they'll be tempted to call it done anyway.

If a group reports "no conflicts found," push back with a concrete prompt-nudge rather than letting it slide:

> "Ask your security and performance specialists to specifically weigh in on the same caching decision — should this endpoint cache a response that includes user-supplied data? Security and performance will not agree by default here."

Other reliable disagreement-generators: input validation strictness (security wants more, usability/performance specialists want less overhead), synchronous vs. async error handling, and whether to log full request bodies (security/debugging value vs. PII exposure).

---

## Cross-references

- Participant lab guides: `labs/` on `scratch-building`.
- Completed reference solution (all bugs fixed, all 3 original candidate features built): `reference-solution` branch.
- Live Managed Agents demo tooling: `demo/managed-agents/` on this branch (`completed_tasks`).
