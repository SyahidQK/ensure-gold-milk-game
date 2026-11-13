@echo off
rem ======================================================================
rem  Fill It Gold - booth launcher (fully offline, no internet needed)
rem  Opens the game full-screen in Chrome (or Edge) straight from this
rem  folder, in its own clean profile. Exit the game with Alt+F4.
rem  If anything goes wrong this window stays open and explains why,
rem  and the details are written to launcher-log.txt in this folder.
rem  Optional: "Start Fill It Gold.bat" ?check  runs the smoothness test.
rem ======================================================================
setlocal
title Fill It Gold - launcher

rem --- folder this .bat is in (works wherever the game folder is copied) ---
set "HERE=%~dp0"
set "LOG=%HERE%launcher-log.txt"
> "%LOG%" echo Fill It Gold launcher - %DATE% %TIME%
>>"%LOG%" echo Game folder: "%HERE%"

rem --- the game files must be next to this .bat (not inside a ZIP) ---
if not exist "%HERE%index.html" goto :no_game
if not exist "%HERE%js\game.js" goto :no_game

rem --- find a browser: Chrome first, then Edge (common install places + Windows registry) ---
set "BROWSER="
call :try "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
call :try "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
call :try "%LocalAppData%\Google\Chrome\Application\chrome.exe"
call :try_reg "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"
call :try_reg "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"
call :try "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
call :try "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
call :try_reg "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe"
if not defined BROWSER goto :no_browser
>>"%LOG%" echo Browser: "%BROWSER%"

rem --- page address as a file:/// link; the first argument can add e.g. ?check ---
set "WEBPATH=%HERE:\=/%"
set "PAGE=file:///%WEBPATH%index.html%~1"
set "PROFILE=%HERE%.kiosk-profile"
>>"%LOG%" echo Page: "%PAGE%"

if defined FILLITGOLD_DRYRUN (
  echo [dry run] "%BROWSER%" --user-data-dir="%PROFILE%" --kiosk "%PAGE%"
  >>"%LOG%" echo Dry run only - browser not started.
  goto :eof
)

start "" "%BROWSER%" --user-data-dir="%PROFILE%" --kiosk --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --disable-features=Translate --overscroll-history-navigation=0 --disable-pinch --ignore-gpu-blocklist --allow-file-access-from-files "%PAGE%"
if errorlevel 1 goto :start_failed
>>"%LOG%" echo Started OK.
goto :eof

rem ---------------------------------------------------------------------
:try
if defined BROWSER exit /b
if exist "%~1" set "BROWSER=%~1"
exit /b

:try_reg
if defined BROWSER exit /b
for /f "tokens=2,*" %%A in ('reg query "%~1" /ve 2^>nul ^| find "REG_SZ"') do (
  if exist "%%~B" set "BROWSER=%%~B"
)
exit /b

:no_game
>>"%LOG%" echo ERROR: index.html / js\game.js not found next to the launcher.
echo.
echo  The game files were not found next to this launcher:
echo     "%HERE%"
echo.
echo  - If you opened it from inside a ZIP file, right-click the ZIP,
echo    choose "Extract All...", then run the launcher from the extracted folder.
echo  - Make sure the whole game folder was copied (index.html, css, js, assets).
echo.
pause
exit /b 1

:no_browser
>>"%LOG%" echo ERROR: no Chrome or Edge found.
echo.
echo  Could not find Google Chrome or Microsoft Edge on this PC.
echo  Please install Google Chrome, then run this launcher again.
echo  (Or open index.html in this folder with any modern browser.)
echo.
pause
exit /b 1

:start_failed
>>"%LOG%" echo ERROR: the browser could not be started.
echo.
echo  The browser could not be started:
echo     "%BROWSER%"
echo  Try opening index.html in this folder directly, and send launcher-log.txt for help.
echo.
pause
exit /b 1
