#!/bin/bash

# Start VoyagerP Development Environment

echo "Starting VoyagerP..."

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv backend/venv
fi

# Activate venv and install dependencies
source backend/venv/bin/activate
pip install -q -r backend/requirements.txt

# Check for .env file
if [ ! -f "backend/.env" ]; then
    echo "Warning: backend/.env not found. Copy .env.example and configure your API keys."
    cp backend/.env.example backend/.env
fi

# Start backend in background
echo "Starting backend server on http://localhost:8000..."
cd backend
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Start frontend
echo "Starting frontend on http://localhost:3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "VoyagerP is running!"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
