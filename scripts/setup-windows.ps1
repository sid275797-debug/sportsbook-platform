# Sportsbook Platform - Windows Setup Script
# Run this from the project root in PowerShell
# Usage: .\scripts\setup-windows.ps1

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot | Split-Path -Parent

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "  Sportsbook Platform - Windows Setup" -ForegroundColor Cyan  
Write-Host "======================================`n" -ForegroundColor Cyan

Set-Location $projectRoot

# Step 1: Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if (-not $nodeVersion) { Write-Host "ERROR: Node.js not found. Install from nodejs.org" -ForegroundColor Red; exit 1 }
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

$pnpmVersion = pnpm --version 2>$null
if (-not $pnpmVersion) { Write-Host "ERROR: pnpm not found. Run: npm install -g pnpm@9" -ForegroundColor Red; exit 1 }
Write-Host "  pnpm: $pnpmVersion" -ForegroundColor Green

$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) { Write-Host "ERROR: Docker not found. Install Docker Desktop" -ForegroundColor Red; exit 1 }
Write-Host "  Docker: $dockerVersion" -ForegroundColor Green

# Step 2: Copy .env
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "`n.env file created from .env.example" -ForegroundColor Green
    Write-Host "NOTE: Edit .env and set JWT_SECRET and REFRESH_TOKEN_SECRET to any random strings" -ForegroundColor Yellow
    $null = Read-Host "Press Enter after you have edited .env..."
} else {
    Write-Host ".env already exists, skipping..." -ForegroundColor Gray
}

# Step 3: Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
pnpm install
Write-Host "Dependencies installed!" -ForegroundColor Green

# Step 4: Build packages
Write-Host "`nBuilding shared packages..." -ForegroundColor Yellow
$packages = @(
    "@sportsbook/shared-types",
    "@sportsbook/logger",
    "@sportsbook/auth-middleware",
    "@sportsbook/redis-client",
    "@sportsbook/kafka-client",
    "@sportsbook/db-client"
)
foreach ($pkg in $packages) {
    Write-Host "  Building $pkg..." -ForegroundColor Gray
    pnpm --filter $pkg build
    if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $pkg" -ForegroundColor Red; exit 1 }
}
Write-Host "All packages built!" -ForegroundColor Green

# Step 5: Start infrastructure
Write-Host "`nStarting Docker infrastructure..." -ForegroundColor Yellow
docker compose up -d postgres redis zookeeper kafka kafka-ui
Write-Host "Waiting 35 seconds for Kafka to start..." -ForegroundColor Gray
Start-Sleep -Seconds 35
Write-Host "Infrastructure started!" -ForegroundColor Green

# Step 6: Run migrations
Write-Host "`nRunning database migrations..." -ForegroundColor Yellow
$services = @("user-service", "wallet-service", "betting-engine", "market-service", "casino-engine")
foreach ($svc in $services) {
    Write-Host "  Migrating $svc..." -ForegroundColor Gray
    Set-Location "services\$svc"
    npx prisma migrate dev --name init --skip-seed 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Migration may have already run for $svc - continuing..." -ForegroundColor Yellow
    } else {
        Write-Host "  $svc migrated OK" -ForegroundColor Green
    }
    Set-Location $projectRoot
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Setup complete! Now start the services:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open 7 PowerShell terminals and run one command in each:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Terminal 1:  cd services\gateway        ; pnpm dev" -ForegroundColor White
Write-Host "  Terminal 2:  cd services\user-service   ; pnpm dev" -ForegroundColor White
Write-Host "  Terminal 3:  cd services\wallet-service ; pnpm dev" -ForegroundColor White
Write-Host "  Terminal 4:  cd services\betting-engine ; pnpm dev" -ForegroundColor White
Write-Host "  Terminal 5:  cd services\market-service ; pnpm dev" -ForegroundColor White
Write-Host "  Terminal 6:  cd services\casino-engine  ; pnpm dev" -ForegroundColor White
Write-Host "  Terminal 7:  cd apps\web                ; pnpm dev" -ForegroundColor White
Write-Host ""
Write-Host "  Then open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
