# Lab 0 — Before you arrive (do this ahead of time)

Everything here should be done **before the workshop starts**, on your own machine, at your own pace. None of it depends on being in the room — the goal is that Lab 1 starts with everyone already set up, instead of burning the first 30 minutes on installs.

If anything below doesn't work, don't wait until the day to find out — ask in advance.

---

## What you'll need

- **Node.js** — major version 18, 20, or 22 (these are the versions Angular 18 actually supports; odd-numbered majors like 19 or 21 won't work correctly)
- A code editor — **VS Code** is recommended, since Claude Code's IDE integration is built for it
- **Claude Code**, installed and signed in
- (optional) **jq** — only used to pretty-print a few example `curl` commands in the docs

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/agentbuild-ai/claude-code-training-taskflow.git
cd claude-code-training-taskflow
```

---

## Step 2 — Run the automated setup script

This installs git/Node/jq if you're missing them, and installs the npm dependencies for every app in the repo. It's safe to re-run — anything already installed is just confirmed, not reinstalled.

**macOS:**
```bash
bash scripts/setup-mac.sh
```

**Windows** (run in a normal PowerShell window):
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
```

> **Windows — received the scripts as a zip attachment?**
> Gmail blocks `.ps1` files for security reasons, so they may have been sent as a `.zip` with files renamed to `.ps1.txt`.
> 1. Unzip the archive into the `scripts\` folder of the repo
> 2. Rename each file to remove the `.txt` extension: `setup-windows.ps1.txt` → `setup-windows.ps1`, and `verify-setup-windows.ps1.txt` → `verify-setup-windows.ps1`
> 3. Then run the command above as normal
>
> If you cloned the repo above, the scripts are already in `scripts\` — skip this entirely.

---

## Step 3 — Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Then run `claude` once from a terminal — it'll prompt you to sign in on first run.

If you're using VS Code, also install the **Claude Code** extension from the Extensions marketplace, so it's available inside your editor as well as your terminal (Lab 3's Extension exercise specifically uses both).

Make sure you (or your organization) actually have an active Claude Code plan or API access before the day — getting that provisioned is not something this script can do for you.

---

## Step 4 — Verify everything

> [!CAUTION]
> **Run this in a separate/new terminal window — not the one where you ran the setup script.**

**macOS:**
```bash
bash scripts/verify-setup-mac.sh
```

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts\verify-setup-windows.ps1
```

This is read-only — it doesn't install anything, it just checks. You're looking for `All checks passed.` at the end.

Then confirm Claude Code itself is working:

```bash
claude --version
```

---

## If the automated script doesn't work for you

Install manually instead:

1. **Node.js 20 LTS** — [nodejs.org](https://nodejs.org) (pick the LTS installer for your OS)
2. **git** — [git-scm.com](https://git-scm.com)

---

## Troubleshooting

- **`verify-setup` reports the wrong Node major version** — reinstall Node 20 LTS from nodejs.org, then close and reopen your terminal completely (a new install doesn't always take effect in an already-open shell).
- **`claude --version` doesn't work after installing** — close and reopen your terminal, then try again. If it still doesn't work, check that npm's global bin directory is on your `PATH`.
- **`git clone` fails with a permission error** — the repo is public, so this is usually a network issue. Try `git clone https://github.com/agentbuild-ai/claude-code-training-taskflow.git` explicitly with HTTPS.

---

## You're ready when:

- `scripts/verify-setup-mac.sh` (or the Windows equivalent) prints `All checks passed.`
- `claude --version` prints a version number
- You can open the repo in VS Code
