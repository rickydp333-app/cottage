@echo off
setlocal
cd /d "%~dp0"

if "%NETLIFY_SITE_ID%"=="" (
  echo ERROR: NETLIFY_SITE_ID is not set.
  echo Set it once in your user environment variables.
  exit /b 1
)

if "%NETLIFY_AUTH_TOKEN%"=="" (
  echo ERROR: NETLIFY_AUTH_TOKEN is not set.
  echo Set it once in your user environment variables.
  exit /b 1
)

echo Deploying website to Netlify production...
call npx netlify-cli deploy --prod --dir . --site %NETLIFY_SITE_ID% --auth %NETLIFY_AUTH_TOKEN%
exit /b %ERRORLEVEL%
