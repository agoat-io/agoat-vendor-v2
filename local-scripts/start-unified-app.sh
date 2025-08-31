#!/bin/bash

# Start Unified AGoat Publisher App (Single React.js App)
echo "🚀 Starting Unified AGoat Publisher App..."

PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT/unified-app"

# Clear cache and temporary files
echo "🧹 Clearing cache and temporary files..."
rm -rf node_modules/.cache/
rm -rf dist/
rm -rf .vite/
rm -rf *.log
echo "✅ Cache cleared"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🎨 Starting Unified App development server on port 3000..."
echo "🔗 API proxy: /api/* → http://localhost:8080/api/*"
echo "📱 Single React.js application without Module Federation"
echo ""

npm run dev
