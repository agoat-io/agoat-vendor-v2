#!/bin/bash

# Start Full Stack React Development Environment with Module Federation
echo "🚀 Starting AGoat Publisher React Full Stack with Runtime Module Federation..."
echo "🧹 All services will clear their cache and temporary files before starting..."

PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down React development servers..."
    kill $API_PID $VIEWER_PID $UI_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

echo "🔧 Starting API server with GCP secrets..."
./local-scripts/start-api.sh &
API_PID=$!

# Wait for API to start
sleep 3

echo "📡 Starting React Viewer (Federation Remote)..."
./local-scripts/start-react-viewer.sh &
VIEWER_PID=$!

# Wait for Viewer to start
sleep 5

echo "🎨 Starting React Main UI (Next.js Host)..."
./local-scripts/start-react-ui.sh &
UI_PID=$!

# Wait for UI to start
sleep 8

echo ""
echo "✅ AGoat Publisher React Stack is running!"
echo ""
echo "📊 API: http://localhost:8080 (Go backend with GCP secrets & hot reload)"
echo "🎨 Main UI: http://localhost:3000 (Next.js with Module Federation)"
echo "📡 Viewer Remote: http://localhost:3001 (React federated components)"
echo "🔑 Login: admin / admin123"
echo "☁️  GCP Project: agoat-publisher-dev"
echo ""
echo "🚀 Key Features:"
echo "   • 🔍 SEO-optimized with Next.js SSR"
echo "   • ⚡ Runtime component loading (zero build-time knowledge)"
echo "   • 📱 Fully responsive design"
echo "   • 🔗 Module Federation for true composability"
echo "   • 🎯 Server-side rendering for crawlers"
echo ""
echo "📝 Individual scripts available:"
echo "   API only:      ./local-scripts/start-api.sh"
echo "   React UI:      ./local-scripts/start-react-ui.sh"
echo "   React Viewer:  ./local-scripts/start-react-viewer.sh"
echo ""
echo "🔄 Runtime Loading Test:"
echo "   1. Stop viewer (Ctrl+C in viewer terminal)"
echo "   2. Main app shows fallback component"
echo "   3. Restart viewer - components load dynamically!"
echo ""
echo "Press Ctrl+C to stop all servers"

# Keep script running
wait

