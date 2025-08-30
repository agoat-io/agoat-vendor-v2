#!/bin/bash

# Start the AGoat Publisher Viewer Microfrontend
echo "Starting AGoat Publisher Viewer Microfrontend..."

# Navigate to the viewer directory
cd "$(dirname "$0")/../app-vue-ui-viewer"

# Clear Vue/Vite cache and build files
echo "🧹 Clearing Vue/Vite cache and build files..."
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/
rm -rf dist/
rm -rf .vite/
rm -rf *.log
echo "✅ Cache cleared"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if we should build for production or run in development
if [ "$1" = "build" ] || [ "$1" = "production" ]; then
    echo "Building viewer for production..."
    npm run build
    
    echo "Starting production server on http://localhost:5175"
    npm run preview
else
    echo "Starting development server on http://localhost:5175"
    npm run dev
fi
