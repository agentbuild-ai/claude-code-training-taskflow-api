<#
.SYNOPSIS
    TaskFlow — Windows environment verification.

.DESCRIPTION
    Read-only: never installs or changes anything. Confirms that everything
    scripts/setup-windows.ps1 was supposed to set up is actually present and
    working -- run this any time you want to check a machine's state without
    re-running the installer.

    Deliberately does NOT run `npm test`: on scratch-building/workshop-
    participants, 4 tests are intentionally broken as part of the workshop --
    that's an application bug, not an environment problem, so it must not
    show up as a verification failure here.

.NOTES
    Run from the repo root:

        powershell -ExecutionPolicy Bypass -File scripts\verify-setup-windows.ps1
#>

$script:Failures = @()
$script:Warnings = @()

function Pass($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "  [!]  $msg" -ForegroundColor Yellow; $script:Warnings += $msg }
function Fail($msg) { Write-Host "  [X]  $msg" -ForegroundColor Red; $script:Failures += $msg }

Write-Host ""
Write-Host "TaskFlow -- Windows setup verification" -ForegroundColor White
Write-Host "──────────────────────────────"

# ── Repo root sanity check ──────────────────────────────────────────────────
if (-not (Test-Path "README.md") -or -not (Test-Path "backend")) {
    Write-Host "This doesn't look like the taskflow-api repo root." -ForegroundColor Red
    Write-Host "  cd into the repo root (the folder with README.md and backend\) and try again."
    exit 1
}

# ── Toolchain ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Toolchain"

if (Get-Command winget -ErrorAction SilentlyContinue) {
    Pass "winget is available"
} else {
    Warn "winget not found (only needed if you want setup-windows.ps1 to install things for you)"
}

if (Get-Command git -ErrorAction SilentlyContinue) {
    Pass "git: $(git --version)"
} else {
    Fail "git not found"
}

$nodeOk = $false
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = (node -v)
    if ($nodeVersion -match '^v(\d+)') {
        $major = [int]$Matches[1]
        if ($major -in 18, 20, 22) {
            Pass "Node.js: $nodeVersion (compatible)"
            $nodeOk = $true
        } else {
            Fail "Node.js: $nodeVersion -- major version $major is not 18, 20, or 22 (Angular 18's supported majors)"
        }
    } else {
        Fail "Node.js found but 'node -v' returned an unexpected format: $nodeVersion"
    }
} else {
    Fail "Node.js not found"
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    Pass "npm: $(npm -v)"
} else {
    Fail "npm not found"
}

if (Get-Command jq -ErrorAction SilentlyContinue) {
    Pass "jq: $(jq --version)"
} else {
    Warn "jq not found (optional -- only used to pretty-print example curl output)"
}

# ── Per-app dependency check ─────────────────────────────────────────────────
# For each app folder that exists, confirm node_modules exists AND actually
# contains every direct dependency/devDependency listed in package.json --
# catches a partial/interrupted install that a bare "does node_modules
# exist" check would miss.
function Check-App {
    param([string]$App)

    Write-Host ""
    Write-Host "$App\"

    $pkgPath = Join-Path $App "package.json"
    if (-not (Test-Path $pkgPath)) {
        Warn "${App}: no package.json -- skipping (not part of this checkout)"
        return
    }

    $nodeModulesPath = Join-Path $App "node_modules"
    if (-not (Test-Path $nodeModulesPath)) {
        Fail "${App}: node_modules missing -- run the setup script or 'npm install' in $App\"
        return
    }
    Pass "${App}: node_modules present"

    if (-not $nodeOk) {
        Warn "${App}: skipping dependency/typecheck detail -- Node.js isn't in a working state (see above)"
        return
    }

    $pkgJsonEscaped = $pkgPath -replace '\\', '/'
    $depsJson = node -e "const p = require('./$pkgJsonEscaped'); console.log(JSON.stringify(Object.keys({...p.dependencies, ...p.devDependencies})))" 2>$null
    $deps = @()
    if ($depsJson) { $deps = $depsJson | ConvertFrom-Json }

    $missing = @()
    foreach ($dep in $deps) {
        if (-not (Test-Path (Join-Path $nodeModulesPath $dep))) {
            $missing += $dep
        }
    }

    if ($missing.Count -eq 0) {
        Pass "${App}: all declared dependencies are present in node_modules"
    } else {
        $shown = ($missing | Select-Object -First 5) -join ", "
        $suffix = if ($missing.Count -gt 5) { " ..." } else { "" }
        Fail "${App}: $($missing.Count) declared dependencies missing from node_modules ($shown$suffix)"
    }

    # Typecheck if the app has one -- fast, non-mutating, and the strongest
    # signal that the installed toolchain actually works together.
    $tsconfigApp = Join-Path $App "tsconfig.app.json"
    if ($App -eq "frontend" -and (Test-Path $tsconfigApp)) {
        Push-Location $App
        npx tsc --noEmit -p tsconfig.app.json *> $null
        $typecheckOk = $LASTEXITCODE -eq 0
        Pop-Location
        if ($typecheckOk) { Pass "${App}: typecheck passes" } else { Fail "${App}: typecheck failed -- run 'npx tsc --noEmit -p tsconfig.app.json' in $App\ to see errors" }
    } elseif ((Get-Content $pkgPath -Raw) -match '"typecheck"') {
        Push-Location $App
        npm run typecheck --silent *> $null
        $typecheckOk = $LASTEXITCODE -eq 0
        Pop-Location
        if ($typecheckOk) { Pass "${App}: typecheck passes" } else { Fail "${App}: typecheck failed -- run 'npm run typecheck' in $App\ to see errors" }
    }
}

foreach ($app in @("backend", "frontend", "demo\managed-agents")) {
    if (Test-Path $app) { Check-App -App $app }
}

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "──────────────────────────────"
if ($script:Failures.Count -eq 0) {
    Write-Host "All checks passed." -ForegroundColor Green
    if ($script:Warnings.Count -gt 0) {
        Write-Host "  ($($script:Warnings.Count) non-blocking warning(s) above.)" -ForegroundColor Yellow
    }
} else {
    Write-Host "$($script:Failures.Count) check(s) failed:" -ForegroundColor Red
    foreach ($f in $script:Failures) {
        Write-Host "  [X] $f" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Run scripts\setup-windows.ps1 to fix most of these."
}

if ($script:Failures.Count -eq 0) { exit 0 } else { exit 1 }
