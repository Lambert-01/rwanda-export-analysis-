#!/bin/bash
# Rwanda trade analysis system- Local Development Startup Script

echo "🇷🇼 Starting Rwanda trade analysis systemLocal Development Environment"
echo "================================================================"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Using default configuration."
    echo "   Copy .env.example to .env and customize if needed."
fi

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

if [ -f "python_processing/requirements.txt" ]; then
    echo "📦 Installing Python processing dependencies..."
    pip install -r python_processing/requirements.txt
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ -f "backend/package.json" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Start backend server (port 3000)
echo "🚀 Starting backend server on port 3000..."
cd backend && npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server (port 3001)
echo "🚀 Starting frontend server on port 3001..."
npm start &
FRONTEND_PID=$!

echo "✅ Rwanda trade analysis systemis now running!"
echo "📊 Frontend: http://localhost:3001"
echo "🔗 Backend API: http://localhost:3000/api"
echo "📈 Dashboard: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait