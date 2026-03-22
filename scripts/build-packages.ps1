# Windows PowerShell: build shared packages in correct order
Write-Host "Building shared packages..." -ForegroundColor Cyan
$packages = @("@sportsbook/shared-types","@sportsbook/logger","@sportsbook/auth-middleware","@sportsbook/redis-client","@sportsbook/kafka-client","@sportsbook/db-client")
foreach ($pkg in $packages) {
    Write-Host "Building $pkg..." -ForegroundColor Yellow
    pnpm --filter $pkg build
    if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $pkg" -ForegroundColor Red; exit 1 }
    Write-Host "OK" -ForegroundColor Green
}
Write-Host "All packages built!" -ForegroundColor Green
