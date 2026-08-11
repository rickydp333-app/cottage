@echo off
setlocal
cd /d "%~dp0"
set JAVA_HOME=C:\Apps\Cottage-info-app\tools\jdk-17
set ANDROID_HOME=C:\Users\Rick\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\Rick\AppData\Local\Android\Sdk
set GRADLE_OPTS=-Dorg.gradle.java.home=C:\Apps\Cottage-info-app\tools\jdk-17
set PATH=%JAVA_HOME%\bin;C:\Users\Rick\AppData\Local\Android\Sdk\platform-tools;C:\Users\Rick\AppData\Local\Android\Sdk\build-tools\34.0.0;%PATH%
echo sdk.dir=C:\Users\Rick\AppData\Local\Android\Sdk > local.properties
call gradlew.bat assembleDebug --console=plain > build.log 2>&1
set BUILD_STATUS=%ERRORLEVEL%
type build.log
echo.
echo BUILD_STATUS=%BUILD_STATUS%
if %BUILD_STATUS% NEQ 0 exit /b %BUILD_STATUS%

echo.
echo APK files:
dir /s /b *.apk
