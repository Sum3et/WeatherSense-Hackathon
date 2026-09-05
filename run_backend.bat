@echo off
cd /d "%~dp0"
title WeatherSense Backend (FastAPI)
echo Starting WeatherSense FastAPI Backend...
echo Access Website and API at: http://localhost:8000
echo Access Interactive Docs at: http://localhost:8000/docs
echo.
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
