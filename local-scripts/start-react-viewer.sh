#!/bin/bash

# Start React Public Viewer (Federated Module)
echo "📡 Starting React Public Viewer (Module Federation Remote)..."

PROJECT_ROOT="$(dirname "$0")/.."
cd "$PROJECT_ROOT/reactjs-public-viewer"

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

