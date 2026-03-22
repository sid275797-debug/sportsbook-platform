@echo off
echo Creating clean zip...

REM Step 1: Remove old temp if exists
if exist temp_zip rmdir /s /q temp_zip

REM Step 2: Create temp folder
mkdir temp_zip

REM Step 3: Copy project excluding heavy/unnecessary folders
robocopy . temp_zip /E /XD node_modules .turbo dist build .git

REM Step 4: Remove old zip if exists
if exist sportsbook-final.zip del sportsbook-final.zip

REM Step 5: Create zip
powershell Compress-Archive -Path ".\temp_zip\*" -DestinationPath "sportsbook-final.zip"

REM Step 6: Cleanup
rmdir /s /q temp_zip

echo.
echo ✅ Zip created: sportsbook-final.zip
pause