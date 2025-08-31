#!/bin/bash

# Start React Main UI Development Server
echo "🚀 Starting React Main UI (React.js + Webpack)..."

PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT/reactjs-app-ui"

# Clear webpack cache
echo "🧹 Clearing webpack cache..."
rm -rf node_modules/.cache/
rm -rf .webpack/
rm -rf dist/
rm -rf build/
rm -rf *.log
rm -rf .turbo/
echo "✅ Cache cleared"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps
fi

echo "🎨 Starting React.js development server on port 3000..."
echo "🔗 API proxy: /api/* → http://localhost:8080/api/*"
echo "📡 Federation remote: http://localhost:3001"

npm run dev

