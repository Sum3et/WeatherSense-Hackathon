@echo off
cd /d "%~dp0"
echo =======================================================
echo       WeatherSense Administrator Account Bootstrapper
echo =======================================================
echo.
python -m backend.scripts.bootstrap_admin %*
pause
