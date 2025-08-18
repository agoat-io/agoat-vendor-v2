#!/bin/bash

# AGoat Publisher Full-Stack Development Startup Script

echo "🚀 Starting AGoat Publisher Full-Stack Development Environment..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down development servers..."
    kill $API_PID $UI_PID $VIEWER_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$PROJECT_ROOT/app-api"
UI_DIR="$PROJECT_ROOT/app-vue-ui"
VIEWER_DIR="$PROJECT_ROOT/app-vue-ui-viewer"

echo "📁 Project root: $PROJECT_ROOT"
echo "🔧 API directory: $API_DIR"
echo "🎨 UI directory: $UI_DIR"
echo "👁️  Viewer directory: $VIEWER_DIR"
echo ""

# Check if directories exist
if [ ! -d "$API_DIR" ]; then
    echo "❌ Error: API directory not found at $API_DIR"
    exit 1
fi

if [ ! -d "$UI_DIR" ]; then
    echo "❌ Error: UI directory not found at $UI_DIR"
    exit 1
fi

if [ ! -d "$VIEWER_DIR" ]; then
    echo "❌ Error: Viewer directory not found at $VIEWER_DIR"
    exit 1
fi

# Start Go API using the dedicated script
echo "🔧 Starting Go API server with GCP secrets..."
./local-scripts/start-api.sh &
API_PID=$!

# Wait a moment for API to start (GCP secrets loading may take longer)
echo "⏳ Waiting for API to start..."
sleep 8

# Check if API is running
if ! curl -s http://localhost:8080/api/status > /dev/null; then
    echo "❌ Error: API failed to start. Check the logs above."
    echo "💡 Make sure you're authenticated with gcloud and have access to the GCP project."
    kill $API_PID 2>/dev/null
    exit 1
fi

echo "✅ API is running on http://localhost:8080"
echo ""

# Start Viewer microfrontend using the dedicated script
echo "👁️  Starting Viewer microfrontend..."
./local-scripts/start-viewer.sh &
VIEWER_PID=$!

# Wait a moment for Viewer to start
sleep 3

# Start Vue UI using the dedicated script
echo "🎨 Starting Vue UI development server..."
./local-scripts/start-ui.sh &
UI_PID=$!

# Wait a moment for UI to start
sleep 5

echo ""
echo "🎉 AGoat Publisher is now running!"
echo ""
echo "📊 API: http://localhost:8080 (with GCP secrets & hot reload)"
echo "🎨 UI:  http://localhost:5173 (with hot reload)"
echo "👁️  Viewer: http://localhost:5175 (microfrontend)"
echo "🔑 Login: admin / admin123"
echo "☁️  GCP Project: agoat-publisher-dev"
echo ""
echo "📝 Individual scripts available:"
echo "   API only:  ./local-scripts/start-api.sh (with hot reload)"
echo "   UI only:   ./local-scripts/start-ui.sh (with hot reload)"
echo "   Viewer:    ./local-scripts/start-viewer.sh (microfrontend)"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user to stop
wait
