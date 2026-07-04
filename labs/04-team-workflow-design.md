# Lab 4 — Team-level workflow design (60 min)

This is the centrepiece lab. Everything so far has been about *your* Claude Code setup. This one is about a **team's**.

Scenario: you're one of 12 engineers on this codebase. Everyone uses Claude Code. Right now, everyone's setup is personal and inconsistent — one person's `CLAUDE.md` improvements never reach anyone else, two people write competing `/review` skills, and nobody agrees on conventions. Your job is to design the shared setup.

---

## Core

Write a **shared project-root `CLAUDE.md`** — one that would make sense checked into version control and used identically by all 12 engineers, not just you. This is different from Lab 2's file: that one could carry your personal shortcuts; this one can't.

Then write **one shared skill** the whole team would run identically — something valuable enough that a new team member would want it on day one.

**You're done when:** you could hand both files to a teammate with zero context and they'd know exactly what to do with them, and neither file contains anything that's really about how *you* personally like to work.

---

## Extension

Take everything you (and the team, hypothetically) might want to configure, and split it correctly across three layers:
- **Personal-global** (`~/.claude/CLAUDE.md`) — things that are about you, follow you to every project
- **Project-root** (what you wrote in Core) — things every team member on *this* project needs
- **Subdirectory** (`backend/` vs `frontend/`) — things specific to one part of the codebase

For each rule you're placing, be able to say why it's in that layer and not one of the others — "it felt right" isn't good enough.

Then **version** the shared skill from Core — add something that lets the team tell v1 from v2 apart (a changelog comment, a version field, a naming convention — your call), so when you improve it later, people aren't confused about which behavior they're getting.

**You're done when:** every rule is in a layer you can justify, and the skill has an unambiguous version marker.

---

## Stretch

Design the governance model. Write a one-page proposal answering, concretely:

- **Ownership** — who owns the shared `CLAUDE.md` and shared skills? One person? A rotating role? Nobody?
- **Change process** — how does someone propose a change? Does it need review? By whom?
- **Collision avoidance** — with 12 people potentially editing the same files, how do you keep them current without stepping on each other or silently drifting out of sync?

Vague answers don't count — "we'll figure it out as a team" is not a governance model. Name the actual mechanism (PR review, a designated maintainer, a weekly sync, whatever you'd genuinely propose).

**You're done when:** your proposal would survive someone asking "okay, but what happens when two people disagree?"
