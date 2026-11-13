@echo off
rem ======================================================================
rem  Fill It Gold - booth launcher (fully offline, no internet needed)
rem  Opens the game full-screen in Chrome (or Edge) straight from this
rem  folder. Exit the game with Alt+F4.
rem  - Chrome's settings for the game are kept on this PC
rem    (%LOCALAPPDATA%\FillItGold), not in the game folder, so the folder
rem    can live on any drive (USB, D:, network) and be copied freely.
rem  - It checks the game really opened; if not it retries, and as a last
rem    resort opens the game in the normal browser. This window explains
rem    any problem, and details go to launcher-log.txt in this folder.
rem  Optional: "Start Fill It Gold.bat" ?check  runs the smoothness test.
rem ======================================================================
setlocal
title Fill It Gold - launcher
echo.
echo   Starting Fill It Gold...

rem --- folder this .bat is in (works wherever the game folder is copied) ---
set "HERE=%~dp0"
set "LOG=%HERE%launcher-log.txt"
> "%LOG%" echo Fill It Gold launcher - %DATE% %TIME%
if errorlevel 1 set "LOG=%TEMP%\fill-it-gold-launcher-log.txt"
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
>>"%LOG%" echo Page: "%PAGE%"

rem --- the game's own browser settings, kept on this PC ---
set "PROFILE=%LOCALAPPDATA%\FillItGold\kiosk-profile"
if not exist "%PROFILE%" mkdir "%PROFILE%" >nul 2>&1
call :clear_locks
>>"%LOG%" echo Profile: "%PROFILE%"

if defined FILLITGOLD_DRYRUN (
  echo [dry run] "%BROWSER%" --user-data-dir="%PROFILE%" --kiosk "%PAGE%"
  >>"%LOG%" echo Dry run only - browser not started.
  goto :eof
)

call :launch
call :check_running
if not errorlevel 1 goto :started

rem --- browser didn't stay open: retry once with fresh settings ---
>>"%LOG%" echo Browser did not stay open - retrying with fresh settings.
echo   The browser didn't open properly - trying again...
rd /s /q "%PROFILE%" >nul 2>&1
mkdir "%PROFILE%" >nul 2>&1
call :launch
call :check_running
if not errorlevel 1 goto :started

rem --- last resort: open the game in the PC's normal browser ---
>>"%LOG%" echo Kiosk start failed twice - opening index.html in the default browser.
start "" "%HERE%index.html"
echo.
echo   Full-screen mode could not be started on this PC, so the game has been
echo   opened in the normal browser instead. Press F11 there for full screen.
echo   Please send launcher-log.txt (in the game folder) for help.
echo.
pause
exit /b 1

:started
>>"%LOG%" echo Started OK.
echo   Game started.
timeout /t 2 /nobreak >nul
goto :eof

rem ---------------------------------------------------------------------
:launch
start "" "%BROWSER%" --user-data-dir="%PROFILE%" --kiosk --no-first-run --no-default-browser-check --autoplay-policy=no-user-gesture-required --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --disable-features=Translate --overscroll-history-navigation=0 --disable-pinch --ignore-gpu-blocklist --allow-file-access-from-files "%PAGE%"
if errorlevel 1 >>"%LOG%" echo Browser could not be launched (start returned an error).
exit /b

:check_running
rem waits a few seconds, then checks a browser process is running with the game's settings folder
timeout /t 6 /nobreak >nul
where powershell >nul 2>&1 || exit /b 0
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-CimInstance Win32_Process -Filter \"Name='chrome.exe' or Name='msedge.exe'\" | Where-Object { $_.CommandLine -like '*FillItGold*kiosk-profile*' }) { exit 0 } else { exit 1 }" >nul 2>&1
exit /b %errorlevel%

:clear_locks
rem leftover lock files from a crashed or copied session stop the browser from starting
del /f /q "%PROFILE%\SingletonLock" "%PROFILE%\SingletonCookie" "%PROFILE%\SingletonSocket" "%PROFILE%\lockfile" >nul 2>&1
exit /b

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
