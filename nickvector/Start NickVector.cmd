@echo off
setlocal
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run NickVector.
  pause
  exit /b 1
)
node --input-type=module -e "try { const response = await fetch('http://127.0.0.1:5187/', { signal: AbortSignal.timeout(3000) }); process.exit((await response.text()).includes('NickVector') ? 0 : 1); } catch { process.exit(1); }"
if not errorlevel 1 (
  start "" "http://localhost:5187/"
  exit /b 0
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 goto failure
)
call npm run build
if errorlevel 1 goto failure
start "" "http://localhost:5187/"
call npm start
if errorlevel 1 goto failure
exit /b 0
:failure
echo NickVector could not start. Check the error above. Port 5187 may already be in use.
pause
exit /b 1