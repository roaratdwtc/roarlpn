@echo off
title Roar Tourism Assistant Backend Manager
echo ===================================================
echo   Starting Roar Tourism AI Assistant Local Backend  
echo ===================================================
echo.
cd /d C:\Users\LENOVO\RoarCRM\RoarWASupportAgent

echo 1. Starting FastAPI Backend (uvicorn) on port 8000...
start /b python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

echo 2. Waiting 3 seconds for server to start...
timeout /t 3 /nobreak >nul

echo 3. Starting ngrok tunnel for port 8000...
echo.
echo NOTE: Close this window to stop both the backend and the tunnel.
echo.
npx ngrok http 8000
