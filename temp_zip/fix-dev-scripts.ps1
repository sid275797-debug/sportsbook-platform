$root = "C:\Users\VCOM\Desktop\chintu\sportsbook-final"
$services = @('user-service', 'wallet-service', 'betting-engine', 'market-service', 'casino-engine')
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

# Step 1: Fix package.json dev scripts to remove "prisma generate &&"
foreach ($svc in $services) {
    $pkgPath = "$root\services\$svc\package.json"
    if (-Not (Test-Path $pkgPath)) {
        Write-Host "[SKIP] $pkgPath not found" -ForegroundColor Yellow
        continue
    }
    $content = Get-Content $pkgPath -Raw
    $fixed = $content -replace 'prisma generate && tsx watch', 'tsx watch'
    $fixed = $fixed -replace 'prisma generate && tsx', 'tsx'
    [System.IO.File]::WriteAllText($pkgPath, $fixed, $utf8NoBom)
    Write-Host "[FIXED] $svc package.json dev script" -ForegroundColor Green
}

Write-Host "`nDone! Now run prisma generate once, then pnpm run dev" -ForegroundColor Cyan
