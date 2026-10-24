@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy RemoteSigned -File "%~dp0Publish.ps1" %*
set "publish_exit=%ERRORLEVEL%"
echo.
if not "%publish_exit%"=="0" echo Publishing did not complete. Read the message above.
pause
exit /b %publish_exit%
