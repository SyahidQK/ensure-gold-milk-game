@echo off
rem ------------------------------------------------------------------
rem  Fill It Gold - booth launcher (fully offline, no internet needed)
rem  Opens the game full-screen in Chrome straight from this folder,
rem  in its own clean profile (no extensions, sign-in or sync running).
rem  Exit with Alt+F4.  To stress-test video smoothness, use
rem  "Run Smoothness Check.bat" instead (see README).
rem ------------------------------------------------------------------
setlocal
set "HERE=%~dp0"
rem page address as a file:/// link (backslashes become slashes; Chrome handles spaces);
rem the first argument can add a query such as ?check
set "WEBPATH=%HERE:\=/%"
set "PAGE=file:///%WEBPATH%index.html%~1"
set "PROFILE=%HERE%.kiosk-profile"

set "BROWSER="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER (
  echo Could not find Google Chrome or Microsoft Edge on this PC.
  pause
  exit /b 1
)

start "" "%BROWSER%" --user-data-dir="%PROFILE%" --kiosk --no-first-run --no-default-browser-check ^
  --autoplay-policy=no-user-gesture-required ^
  --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows ^
  --disable-features=Translate --overscroll-history-navigation=0 --disable-pinch ^
  --ignore-gpu-blocklist --allow-file-access-from-files ^
  "%PAGE%"
endlocal
