@echo off
REM Rwanda Export Explorer - Server Restart Script

echo 🛑 Stopping existing servers...
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /T /F >nul 2>&1

echo ⏳ Waiting for servers to stop...
timeout /t 2 /nobreak >nul

echo 🚀 Starting fresh servers...

REM Start backend server (port 3000)
echo Starting backend server on port 3000...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server (port 3001)
echo Starting frontend server on port 3001...
start "Frontend Server" cmd /k "npm start"

echo ✅ Servers restarted!
echo 📊 Backend: http://localhost:3000
echo 🌐 Frontend: http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul