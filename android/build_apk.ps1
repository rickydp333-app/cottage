$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$java = 'C:\Apps\Cottage-info-app\tools\jdk-17\bin\java.exe'
$javac = 'C:\Apps\Cottage-info-app\tools\jdk-17\bin\javac.exe'
if (-not (Test-Path $java)) { throw "Java not found at $java" }
if (-not (Test-Path $javac)) { throw "Javac not found at $javac" }
$env:JAVA_HOME = 'C:\Apps\Cottage-info-app\tools\jdk-17'
$env:ANDROID_HOME = 'C:\Users\Rick\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = 'C:\Users\Rick\AppData\Local\Android\Sdk'
$env:PATH = 'C:\Apps\Cottage-info-app\tools\jdk-17\bin;C:\Users\Rick\AppData\Local\Android\Sdk\platform-tools;C:\Users\Rick\AppData\Local\Android\Sdk\build-tools\34.0.0;' + $env:PATH
Set-Content -Path 'local.properties' -Value 'sdk.dir=C:\Users\Rick\AppData\Local\Android\Sdk'
$gradleHome = 'C:\Users\Rick\AppData\Local\Temp\gradle-8.10.2\gradle-8.10.2'
$gradleLauncher = Join-Path $gradleHome 'lib\gradle-launcher-8.10.2.jar'
$gradleLib = Join-Path $gradleHome 'lib'
if (-not (Test-Path $gradleLauncher)) { throw "Gradle launcher not found at $gradleLauncher" }
if (-not (Test-Path $gradleLib)) { throw "Gradle lib dir not found at $gradleLib" }
$gradleArgs = @('assembleDebug', '--console=plain')
$javaExe = 'C:\Apps\Cottage-info-app\tools\jdk-17\bin\java.exe'
$classpath = $gradleLauncher + ';' + (Get-ChildItem -Path $gradleLib -Filter '*.jar' | ForEach-Object { $_.FullName }) -join ';'
& $javaExe '-Dorg.gradle.appname=gradle' '-cp' $classpath 'org.gradle.launcher.GradleMain' @gradleArgs 2>&1 | Tee-Object -FilePath 'build.log'
exit $LASTEXITCODE
