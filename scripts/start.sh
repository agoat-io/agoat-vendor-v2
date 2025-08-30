#!/bin/bash

# Top Vitamin Supply Hotwire App Startup Script

echo "🚀 Starting Top Vitamin Supply Hotwire App..."

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go first."
    exit 1
fi

# Check if the API server is running
echo "🔍 Checking if API server is running..."
if ! curl -s http://localhost:8080/api/status > /dev/null; then
    echo "⚠️  API server is not running on http://localhost:8080"
    echo "   Please start the agoat-publisher API server first:"
    echo "   cd /path/to/agoat-publisher && ./local-scripts/start-api.sh"
    echo ""
    echo "   Or start the full stack:"
    echo "   cd /path/to/agoat-publisher && ./local-scripts/start-full-stack-react.sh"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Load templates
echo "📝 Loading templates..."
if [ ! -d "web/templates" ]; then
    echo "❌ Templates directory not found. Please check the project structure."
    exit 1
fi

# Build and run the application
echo "🔨 Building and starting the Hotwire app..."
echo "📊 API: http://localhost:8080"
echo "🎨 Web: http://localhost:3000"
echo ""

# Set environment variables
export PORT=3000
export API_BASE_URL=http://localhost:8080/api

# Run the application
go run cmd/server/main.go
