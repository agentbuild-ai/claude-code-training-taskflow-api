# Lab 3 — Debug the test suite (35 min)

---

## Core

Run this single prompt:

> "Fix all failing tests in backend/tests/. Don't change test assertions — fix the implementation."

Let it run without intervening. Watch it plan, edit files, run tests, and iterate.

If it gets stuck, give it one clarifying prompt.

When tests pass: review every change it made. Anything surprising?

**You're done when:** `cd backend && npm test` is all green.

---

## Extension

Run the exact same fix again — but this time from a clean state (`git checkout` the files back to their broken state first, or just re-run against a fresh clone), using terminal batch mode instead of the interactive VS Code session:

```bash
claude -p "Fix all failing tests in backend/tests/. Don't change test assertions — fix the implementation."
```

Compare the two runs.

**You're done when:** you can name at least two concrete differences between the batch-mode run and the interactive one — not just "one has a UI," but things like what you could/couldn't intervene on, how much you could see mid-run, what the final diff looked like.

---

## Stretch

Introduce a subtle regression on purpose, on top of your now-fixed code. Then run your `/review` skill from Lab 2 against it (if you skipped that Extension, borrow the checklist pattern and write a minimal one now — it doesn't need sub-agents for this).

Ask your facilitator if you want a suggested regression to plant, or invent your own — the more subtle, the better the test.

**You're done when:** you know, definitively, whether your review skill would have caught your own bug — and if it didn't, why not.
