#!/bin/bash

# Start SSR Federation Development Environment
echo "🚀 Starting AGoat Publisher with Server-Side Module Federation..."

PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down SSR Federation servers..."
    kill $API_PID $VIEWER_PID $SSR_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

echo "🔧 Starting API server with GCP secrets..."
./local-scripts/start-api.sh &
API_PID=$!

# Wait for API to start
sleep 3

echo "📡 Starting Viewer Remote (Federation Module)..."
cd app-vue-ui-viewer
if [ ! -d "node_modules" ]; then
    echo "Installing viewer dependencies..."
    npm install
fi

# Build the remote module
echo "🏗️  Building remote module..."
npm run build

# Start the remote server
npm run preview &
VIEWER_PID=$!

cd ..

echo "🖥️  Starting Main App with SSR..."
cd app-vue-ui
if [ ! -d "node_modules" ]; then
    echo "Installing main app dependencies..."
    npm install
fi

# Build for SSR
echo "🏗️  Building SSR app..."
npm run build

# Start SSR server
echo "🌐 Starting SSR server..."
npm run serve:ssr &
SSR_PID=$!

cd ..

# Wait for servers to start
sleep 5

echo ""
echo "✅ AGoat Publisher SSR Federation is running!"
echo ""
echo "📊 API: http://localhost:8080 (with GCP secrets & hot reload)"
echo "📡 Remote Module: http://localhost:5175 (federated components)"
echo "🌐 SSR App: http://localhost:3000 (SEO-optimized)"
echo "🔧 Dev App: http://localhost:5173 (development)"
echo "🔑 Login: admin / admin123"
echo ""
echo "🔍 SEO Benefits:"
echo "   • Server-side rendered content"
echo "   • Pre-loaded data for crawlers"
echo "   • Dynamic meta tags"
echo "   • Federation at runtime"
echo ""
echo "📱 Responsive design optimized for all screen sizes"
echo ""
echo "Press Ctrl+C to stop all servers"

# Keep script running
wait
