#!/bin/bash

# Simple Puppeteer Test Script for AGoat Publisher React App
# Assumes services are already running on localhost:8080 and localhost:3000

echo "🧪 Running simple Puppeteer tests for AGoat Publisher React App..."
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_SCRIPT="$PROJECT_ROOT/test-react-app-puppeteer.js"

echo "📁 Project root: $PROJECT_ROOT"
echo "🧪 Test script: $TEST_SCRIPT"
echo ""

# Check if test script exists
if [ ! -f "$TEST_SCRIPT" ]; then
    echo "❌ Error: Test script not found at $TEST_SCRIPT"
    exit 1
fi

# Check if services are running
echo "🔍 Checking if services are running..."

# Check API
if ! curl -s http://localhost:8080/api/status > /dev/null 2>&1; then
    echo "❌ API is not running on http://localhost:8080"
    echo "💡 Please start the API first with: ./local-scripts/start-api.sh"
    exit 1
fi

# Check frontend
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Frontend is not running on http://localhost:3000"
    echo "💡 Please start the frontend first with: ./local-scripts/start-ui.sh"
    exit 1
fi

echo "✅ Services are running!"
echo ""

# Check if puppeteer is installed
if ! npm list puppeteer > /dev/null 2>&1; then
    echo "📦 Installing Puppeteer..."
    npm install puppeteer
fi

# Make test script executable
chmod +x "$TEST_SCRIPT"

# Run tests
echo "🧪 Starting Puppeteer tests..."
echo ""

node "$TEST_SCRIPT"
TEST_EXIT_CODE=$?

echo ""
echo "🧪 Test execution completed with exit code: $TEST_EXIT_CODE"

# Show test results
if [ -d "$PROJECT_ROOT/test-screenshots" ]; then
    echo ""
    echo "📸 Screenshots captured:"
    ls -la "$PROJECT_ROOT/test-screenshots/"*.png 2>/dev/null | wc -l | xargs echo "   Total screenshots:"
    echo "   Screenshot directory: $PROJECT_ROOT/test-screenshots/"
fi

exit $TEST_EXIT_CODE
