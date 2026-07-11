@echo off
title PropPulse CRM - Demo Server
echo ============================================
echo   PropPulse CRM  -  starting demo server
echo ============================================
echo.
cd /d "%~dp0"

REM First-time setup runs only if needed
if not exist "node_modules" (
  echo Installing dependencies (first run only)...
  call npm install
  call npx prisma db push
  call npm run seed
)

echo Starting server... keep THIS window open during the demo.
echo Opening http://localhost:3000 in your browser...
start "" http://localhost:3000
call npm run dev
pause
