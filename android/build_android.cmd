@echo off
setlocal
cd /d "%~dp0"
set JAVA_HOME=C:\Apps\Cottage-info-app\tools\jdk-17
set ANDROID_HOME=C:\Users\Rick\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\Rick\AppData\Local\Android\Sdk
set PATH=C:\Apps\Cottage-info-app\tools\jdk-17\bin;C:\Users\Rick\AppData\Local\Android\Sdk\platform-tools;C:\Users\Rick\AppData\Local\Android\Sdk\build-tools\34.0.0;%PATH%
set GRADLE_OPTS=-Dorg.gradle.java.home=%JAVA_HOME%
set WEB_SRC=C:\Apps\Cottage-info-app
set WEB_DST=C:\Apps\Cottage-info-app\android\app\src\main\assets\www

echo Syncing web assets into Android project...
if not exist "%WEB_DST%" mkdir "%WEB_DST%"
copy /Y "%WEB_SRC%\index.html" "%WEB_DST%\index.html" >nul
copy /Y "%WEB_SRC%\app.js" "%WEB_DST%\app.js" >nul
copy /Y "%WEB_SRC%\data.js" "%WEB_DST%\data.js" >nul
copy /Y "%WEB_SRC%\styles.css" "%WEB_DST%\styles.css" >nul
copy /Y "%WEB_SRC%\service-worker.js" "%WEB_DST%\service-worker.js" >nul
copy /Y "%WEB_SRC%\manifest.webmanifest" "%WEB_DST%\manifest.webmanifest" >nul
if exist "%WEB_SRC%\data.private.js" copy /Y "%WEB_SRC%\data.private.js" "%WEB_DST%\data.private.js" >nul
if not exist "%WEB_DST%\assets" mkdir "%WEB_DST%\assets"
copy /Y "%WEB_SRC%\assets\logo.jpg" "%WEB_DST%\assets\logo.jpg" >nul

echo JAVA_HOME=%JAVA_HOME%
echo sdk.dir=C:/Users/Rick/AppData/Local/Android/Sdk>local.properties
call gradlew.bat assembleDebug --console=plain --stacktrace
exit /b %ERRORLEVEL%
