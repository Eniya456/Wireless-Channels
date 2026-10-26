@echo off
cd /d "%~dp0"
echo ======================================================================
echo Launching Wireless Channel Simulation & ML Platform
echo ======================================================================

echo [1/2] Starting FastAPI Backend on port 8000...
start "WirelessSim Backend API" cmd /k ""%~dp0run_backend.bat""

echo [2/2] Starting React Vite Frontend on port 5173...
start "WirelessSim Frontend UI" cmd /k ""%~dp0run_frontend.bat""

echo.
echo Application launched!
echo - Frontend UI: http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo ======================================================================
timeout /t 5 >nul
start http://localhost:5173
