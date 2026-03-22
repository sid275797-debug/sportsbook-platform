@echo off
setlocal enabledelayedexpansion
set ROOT=%cd%
set U=postgres
set P=postgres
set H=localhost
set PORT=5432

for %%S in (user-service wallet-service betting-engine market-service casino-engine) do (
    echo.
    echo ===== Migrating %%S =====
    cd "%ROOT%\services\%%S"

    if "%%S"=="user-service"    set DB=userdb
    if "%%S"=="wallet-service"  set DB=walletdb
    if "%%S"=="betting-engine"  set DB=bettingdb
    if "%%S"=="market-service"  set DB=marketdb
    if "%%S"=="casino-engine"   set DB=casinodb

    echo DATABASE_URL=postgresql://!U!:!P!@!H!:!PORT!/!DB!?schema=public> .env
    npx prisma migrate dev --name init --skip-seed

    if errorlevel 1 (
        echo [FAILED] %%S migration failed!
    ) else (
        echo [OK] %%S migrated successfully
    )
    cd "%ROOT%"
)

echo.
echo ===== All done =====
pause