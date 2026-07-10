<#
.SYNOPSIS
    TaskFlow — Windows environment setup.

.DESCRIPTION
    Installs everything needed to run this project end-to-end: git, a working
    Node.js (major 18, 20, or 22 — Angular 18's supported majors), jq (used in
    the README's example curl commands), and the npm dependencies for every
    app folder present in this checkout (backend/, frontend/, demo/managed-
    agents/ — whichever exist; not every branch has all three).

    Safe to re-run. Every step checks what's already there before installing,
    so an already-set-up machine just gets confirmed, not reinstalled.

.NOTES
    Run from the repo root in a normal PowerShell window (not as Administrator
    unless winget prompts you to be):

        powershell -ExecutionPolicy Bypass -File scripts\setup-windows.ps1
#>

$ErrorActionPreference = 'Continue'
$script:Failures = @()

function Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  [!]  $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "  [X]  $msg" -ForegroundColor Red; $script:Failures += $msg }

Write-Host ""
Write-Host "TaskFlow -- Windows setup" -ForegroundColor White
Write-Host "──────────────────────────────"

# ── Repo root sanity check ──────────────────────────────────────────────────
if (-not (Test-Path "README.md") -or -not (Test-Path "backend")) {
    Write-Host "This doesn't look like the taskflow-api repo root." -ForegroundColor Red
    Write-Host "  cd into the repo root (the folder with README.md and backend\) and try again."
    exit 1
}

# Re-read PATH from the registry so a package just installed by winget in this
# same run becomes visible without needing to reopen the terminal.
function Refresh-Path {
    $machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = "$machinePath;$userPath"
}

# ── winget ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Checking winget..."
$wingetAvailable = $null -ne (Get-Command winget -ErrorAction SilentlyContinue)
if ($wingetAvailable) {
    Ok "winget is available"
} else {
    Warn "winget not found. Install 'App Installer' from the Microsoft Store, then re-run this script."
    Warn "(git and Node.js below will need to be installed manually without winget.)"
}

# ── git ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Checking git..."
if (Get-Command git -ErrorAction SilentlyContinue) {
    $gitVersion = (git --version)
    Ok "git already installed ($gitVersion)"
} elseif ($wingetAvailable) {
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements | Out-Null
    Refresh-Path
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Ok "git installed"
    } else {
        Fail "git install via winget reported success but 'git' still isn't on PATH -- open a new terminal and try again"
    }
} else {
    Fail "git missing and winget unavailable -- install manually from https://git-scm.com"
}

# ── Node.js (need major 18, 20, or 22 -- Angular 18's supported majors) ─────
Write-Host ""
Write-Host "Checking Node.js..."

function Get-NodeMajor {
    $v = (node -v 2>$null)
    if ($v -match '^v(\d+)') { return [int]$Matches[1] }
    return $null
}

$needNode = $true
if (Get-Command node -ErrorAction SilentlyContinue) {
    $major = Get-NodeMajor
    if ($major -in 18, 20, 22) {
        Ok "Node.js $(node -v) already installed and compatible"
        $needNode = $false
    } else {
        Warn "Node.js $(node -v) found, but this project needs major version 18, 20, or 22 -- installing current LTS"
    }
} else {
    Warn "Node.js not found -- installing current LTS"
}

if ($needNode) {
    if ($wingetAvailable) {
        winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements | Out-Null
        Refresh-Path
        $major = Get-NodeMajor
        if ($major -in 18, 20, 22) {
            Ok "Node.js $(node -v) installed"
        } elseif ($major) {
            Warn "Node.js $(node -v) installed, but that major version isn't in Angular 18's supported list (18/20/22) -- check https://angular.dev for current requirements"
        } else {
            Fail "Node.js install via winget reported success but 'node' still isn't on PATH -- open a new terminal and re-run this script"
        }
    } else {
        Fail "Node.js missing and winget unavailable -- install Node 18/20/22 manually from https://nodejs.org"
    }
}

# ── jq (used in the README's example curl commands) ──────────────────────────
Write-Host ""
Write-Host "Checking jq..."
if (Get-Command jq -ErrorAction SilentlyContinue) {
    Ok "jq already installed"
} elseif ($wingetAvailable) {
    winget install --id jqlang.jq -e --source winget --accept-package-agreements --accept-source-agreements | Out-Null
    Refresh-Path
    if (Get-Command jq -ErrorAction SilentlyContinue) {
        Ok "jq installed"
    } else {
        Warn "jq install didn't take effect yet -- open a new terminal if you want it (optional, only used to pretty-print example curl output)"
    }
} else {
    Warn "jq not installed (optional -- only used to pretty-print example curl output)"
}

# ── App dependencies -- only for folders that exist in this checkout ────────
Write-Host ""
Write-Host "Installing app dependencies..."
foreach ($app in @("backend", "frontend", "demo\managed-agents")) {
    if ((Test-Path $app) -and (Test-Path (Join-Path $app "package.json"))) {
        Write-Host "  $app\"
        Push-Location $app
        npm install --silent
        $npmSucceeded = $LASTEXITCODE -eq 0
        Pop-Location
        if ($npmSucceeded) {
            Ok "$app dependencies installed"
        } else {
            Fail "${app}: npm install failed -- see output above"
        }
    }
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "──────────────────────────────"
if ($script:Failures.Count -eq 0) {
    Write-Host "Setup complete." -ForegroundColor Green
} else {
    Write-Host "Setup finished with $($script:Failures.Count) issue(s):" -ForegroundColor Yellow
    foreach ($f in $script:Failures) {
        Write-Host "  [X] $f" -ForegroundColor Red
    }
}
Write-Host ""
Write-Host "Next steps:"
if (Test-Path "backend") { Write-Host "  cd backend  ; npm test ; npm run dev   # API on :3000" }
if (Test-Path "frontend") { Write-Host "  cd frontend ; npx ng serve             # UI on :4200" }
if (Test-Path "demo\managed-agents") { Write-Host "  cd demo\managed-agents ; type README.md   # live-demo harness setup" }

# Exit code reflects whether anything actually failed, not whichever
# conditional "next steps" line happened to run last.
if ($script:Failures.Count -eq 0) { exit 0 } else { exit 1 }
