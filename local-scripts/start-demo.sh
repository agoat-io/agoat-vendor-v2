#!/bin/bash

# agoat-ui-toolkit-demo startup script
# This script starts the demo application for the agoat-ui-toolkit components

set -e

echo "🚀 Starting agoat-ui-toolkit-demo..."

# Navigate to the demo directory
DEMO_DIR="/Volumes/My Shared Files/projects/agoat-ui-toolkit-demo"
cd "$DEMO_DIR"

echo "📁 Working directory: $(pwd)"

# Clear Vite cache and temporary files
echo "🧹 Clearing Vite cache and temporary files..."
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/
rm -rf dist/
rm -rf .vite/
rm -rf *.log
echo "✅ Cache cleared"
echo ""

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if required files exist
if [ ! -f "src/main.tsx" ]; then
    echo "❌ Error: src/main.tsx not found. Please ensure all source files are present."
    exit 1
fi

if [ ! -f "src/App.tsx" ]; then
    echo "❌ Error: src/App.tsx not found. Please ensure all source files are present."
    exit 1
fi

# Start the development server
echo "🎯 Starting Vite development server..."
echo "📱 Demo will be available at: http://localhost:5173/"
echo "🔗 Pages:"
echo "   • Home: http://localhost:5173/"
echo "   • DateRangePicker Demo: http://localhost:5173/daterangepicker"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
