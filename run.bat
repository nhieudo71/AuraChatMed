@echo off
chcp 437 >nul
setlocal

cd /d "%~dp0"

set PORT=6768
set HOST=0.0.0.0

echo.
echo  ==========================================================
echo    AuraChat AI  -  Development Server
echo    URL: http://localhost:%PORT%
echo  ==========================================================
echo.

where node >nul 2>nul
if errorlevel 1 goto NODE_MISSING

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo  [OK] Node.js %NODE_VERSION%

if not exist "node_modules" goto INSTALL_DEPS
echo  [OK] Dependencies found.
goto CHECK_ENV

:INSTALL_DEPS
echo.
echo  [1/2] Installing dependencies, please wait...
echo.
if exist "bun.lock" (
    where bun >nul 2>nul
    if not errorlevel 1 (
        call bun install
        goto AFTER_INSTALL
    )
)
call npm install --legacy-peer-deps
:AFTER_INSTALL
if errorlevel 1 goto INSTALL_FAILED
echo.
echo  [OK] Dependencies installed.

:CHECK_ENV
if exist ".env" goto START_SERVER
if not exist ".env.example" goto START_SERVER
copy /y ".env.example" ".env" >nul
echo  [OK] Created .env from .env.example
echo       Open .env and set GEMINI_API_KEY if needed.

:START_SERVER
echo.
echo  [2/2] Starting Vite on port %PORT%
echo        Press Ctrl+C to stop.
echo.

start "" /b cmd /c "ping -n 5 127.0.0.1 >nul & start "" http://localhost:%PORT%"

call npm run dev
goto SERVER_STOPPED

:NODE_MISSING
echo  [ERROR] Node.js not found on this computer.
echo          Install it from: https://nodejs.org/
echo.
pause
exit /b 1

:INSTALL_FAILED
echo.
echo  [ERROR] Dependency installation failed.
echo          Check your internet connection and try again.
echo.
pause
exit /b 1

:SERVER_STOPPED
echo.
echo  Server stopped.
pause
endlocal
