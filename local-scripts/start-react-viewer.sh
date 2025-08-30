#!/bin/bash

# Start React Public Viewer (Federated Module)
echo "📡 Starting React Public Viewer (Module Federation Remote)..."

PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT/reactjs-public-viewer"

# Clear React build cache and webpack cache
echo "🧹 Clearing React build cache and webpack cache..."
rm -rf build/
rm -rf dist/
rm -rf node_modules/.cache/
rm -rf .webpack/
rm -rf *.log
rm -rf federated-dist/
echo "✅ Cache cleared"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🏗️  Starting federated module on port 3001..."
echo "🔗 Exposes: PostsList, PostViewer, App"
echo "🌐 Remote entry: http://localhost:3001/remoteEntry.js"

# Start development server
npm start

