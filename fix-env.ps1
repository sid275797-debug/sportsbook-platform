$root = "C:\Users\VCOM\Desktop\chintu\sportsbook-final"

$services = @{
    'user-service'   = 'userdb'
    'wallet-service' = 'walletdb'
    'betting-engine' = 'bettingdb'
    'market-service' = 'marketdb'
    'casino-engine'  = 'casinodb'
}

foreach ($svc in $services.Keys) {
    $db  = $services[$svc]
    $url = "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/$db" + "?schema=public"
    $envPath = "$root\services\$svc\.env"
    Set-Content -Path $envPath -Value $url -Encoding UTF8
    Write-Host "Written: $envPath  ->  $url"
}

Write-Host "`nDone! Verifying..." -ForegroundColor Green
foreach ($svc in $services.Keys) {
    Write-Host "`n[$svc]"
    Get-Content "$root\services\$svc\.env"
}