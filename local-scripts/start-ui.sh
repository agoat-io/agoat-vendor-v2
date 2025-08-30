#!/bin/bash

# AGoat Publisher Vue UI Development Startup Script

echo "🎨 Starting AGoat Publisher Vue UI Development Server..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UI_DIR="$PROJECT_ROOT/app-vue-ui"

echo "📁 Project root: $PROJECT_ROOT"
echo "🎨 UI directory: $UI_DIR"
echo ""

# Check if we're in the right directory
if [ ! -f "$UI_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in $UI_DIR"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Clear Vue/Vite cache and temporary files
echo "🧹 Clearing Vue/Vite cache and temporary files..."
cd "$UI_DIR"
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/
rm -rf dist/
rm -rf .vite/
rm -rf .nuxt/
rm -rf .output/
rm -rf *.log
echo "✅ Cache cleared"
echo ""

# Check if dependencies are installed
if [ ! -d "$UI_DIR/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f "$UI_DIR/.env" ]; then
    echo "⚙️  Creating .env file..."
    cd "$UI_DIR"
    cat > .env << EOF
# API Configuration
VITE_API_URL=http://localhost:8080/api
EOF
    echo "✅ Created .env file with default API URL"
fi

# Start the development server with hot reload
echo "🌐 Starting development server on http://localhost:5173"
echo "🔥 Hot reload enabled (Vite)"
echo "📝 Make sure the Go API is running on http://localhost:8080"
echo "🔑 Default login: admin / admin123"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$UI_DIR"
npm run dev
