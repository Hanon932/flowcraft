@echo off
cd /d "%~dp0"
set "PATH=C:\Users\wtrud\AppData\Local\Volta\tools\image\node\20.12.0;%PATH%"

powershell -NoProfile -Command "if (-not (Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue)) { exit 1 } else { exit 0 }"
if not errorlevel 1 goto open

start "FlowCraft Dev Server" cmd /k "set PATH=C:\Users\wtrud\AppData\Local\Volta\tools\image\node\20.12.0;%PATH% && npm run dev"

:wait
powershell -NoProfile -Command "if (Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Quiet -WarningAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto wait
)

:open
start "" http://localhost:5173
