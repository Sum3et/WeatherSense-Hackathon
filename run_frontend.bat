@echo off
cd /d "%~dp0"
title WeatherSense Frontend (React + Vite)
echo Starting WeatherSense React Frontend...
echo Access Frontend at: http://localhost:5173
echo.
cd frontend
npm run dev
pause
