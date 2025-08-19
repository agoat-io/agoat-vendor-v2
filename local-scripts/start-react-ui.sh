#!/bin/bash

# Start React Main UI Development Server
echo "🚀 Starting React Main UI (Next.js)..."

PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT/reactjs-app-ui"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo "🎨 Starting Next.js development server on port 3000..."
echo "🔗 API proxy: /api/* → http://localhost:8080/api/*"
echo "📡 Federation remote: http://localhost:3001"

npm run dev

