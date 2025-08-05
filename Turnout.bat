@echo off
REM ============================================================================
REM == Turnout Full-Stack Application Launcher
REM == This script installs dependencies and starts the backend and frontend servers.
REM ============================================================================

title Turnout Launcher

echo.
echo ============================================
echo      Starting Turnout Application
echo ============================================
echo.

REM --- Step 1: Check and Install Server Dependencies ---
echo [1/5] Navigating to server directory...
pushd server

echo [2/5] Checking server dependencies (npm install)...
call npm install
echo Server dependencies are up to date.
echo.
popd

REM --- Step 2: Check and Install Client Dependencies ---
echo [3/5] Navigating to client directory...
pushd client

echo [4/5] Checking client dependencies (npm install)...
call npm install
echo Client dependencies are up to date.
echo.
popd

REM --- Step 3: Launch Servers in New Windows ---
echo [5/5] Launching servers in new windows...
echo.

REM Start the Node.js backend server in a new window (defaulting to 5001 from .env or package.json)
start "Turnout Server" cmd /k "cd server && npm run dev"

REM Start the React frontend server in a new window on a different, odd port (e.g., 3003)
REM This command now also handles opening the browser.
start "Turnout Client" cmd /k "cd client && set PORT=3003 && npm start"

echo.
echo Servers are launching. The Turnout application will open in your browser automatically.
echo This launcher window can now be closed.

REM --- End of Script ---
exit