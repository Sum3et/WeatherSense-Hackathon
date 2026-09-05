@echo off
cd /d "%~dp0"
echo =========================================================
echo   WeatherSense - National Weather Analytics Platform
echo   SIH 2026 - Ministry of Earth Sciences (MoES)
echo =========================================================
echo.
echo Starting Backend (FastAPI) and Frontend (Vite) concurrently...
echo.

start "WeatherSense Backend (FastAPI)" cmd /k "cd /d "%~dp0" && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

start "WeatherSense Frontend (React)" cmd /k "cd /d "%~dp0\frontend" && npm run dev"

echo Both services have been launched in separate windows!
echo.
echo - Main Web Application (Vite Dev): http://localhost:5173
echo - Backend API ^& Production App:    http://localhost:8000
echo - Swagger API Documentation:       http://localhost:8000/docs
echo.
echo (You can close this window now without stopping the servers)
pause
