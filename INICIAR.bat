@echo off
title Casamento dos Louva-a-Deus (PC)
cd /d "%~dp0servidor"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  O Node.js nao esta instalado. Baixe a versao LTS em https://nodejs.org
  start "" https://nodejs.org
  pause
  exit /b
)
if not exist "node_modules\tiktok-live-connector" (
  echo  Primeira vez: instalando... aguarde 1 ou 2 minutos.
  call npm install --no-audit --no-fund
)
start "" http://localhost:8787
node server.js
pause
