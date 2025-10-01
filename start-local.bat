@echo off
REM Rwanda Export Explorer - Local Development Startup Script for Windows

echo 🇷🇼 Starting Rwanda Export Explorer Local Development Environment
echo ================================================================

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: .env file not found. Using default configuration.
    echo    Copy .env.example to .env and customize if needed.
    echo.
)

REM Install Python dependencies if requirements.txt exists
if exist "requirements.txt" (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
)

if exist "python_processing\requirements.txt" (
    echo 📦 Installing Python processing dependencies...
    pip install -r python_processing\requirements.txt
)

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
call npm install

if exist "backend\package.json" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Start backend server (port 3000)
echo 🚀 Starting backend server on port 3000...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server (port 3001)
echo 🚀 Starting frontend server on port 3001...
start "Frontend Server" cmd /k "npm start"

echo ✅ Rwanda Export Explorer is now running!
echo 📊 Frontend: http://localhost:3001
echo 🔗 Backend API: http://localhost:3000/api
echo 📈 Dashboard: http://localhost:3001
echo.
echo Press any key to stop all servers and exit...
pause >nul

REM Cleanup function
echo.
echo 🛑 Shutting down servers...
taskkill /FI "WINDOWTITLE eq Backend Server*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Frontend Server*" /T /F >nul 2>&1
echo ✅ All servers stopped