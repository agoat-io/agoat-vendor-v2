#!/bin/bash

# AGoat Publisher React App Puppeteer Test Script
# Starts the full stack and runs comprehensive Puppeteer tests

echo "🧪 Starting AGoat Publisher React App Puppeteer Tests..."
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

# Check if puppeteer is installed
if ! npm list puppeteer > /dev/null 2>&1; then
    echo "📦 Installing Puppeteer..."
    npm install puppeteer
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Cleaning up..."
    
    # Kill background processes
    if [ ! -z "$FULL_STACK_PID" ]; then
        echo "🛑 Stopping full stack services..."
        kill $FULL_STACK_PID 2>/dev/null || true
    fi
    
    # Wait a moment for processes to stop
    sleep 2
    
    echo "✅ Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the full stack in background
echo "🚀 Starting full stack services..."
echo "📋 This will start both API and frontend services"
echo "⏳ Please wait for services to be ready..."
echo ""

# Start the full stack script in background
"$PROJECT_ROOT/local-scripts/start-full-stack-unified.sh" > full-stack.log 2>&1 &
FULL_STACK_PID=$!

echo "✅ Full stack started (PID: $FULL_STACK_PID)"
echo "📋 Full stack log: full-stack.log"
echo ""

# Wait for services to start
echo "⏳ Waiting for services to start..."
echo "   API: http://localhost:8080"
echo "   Frontend: http://localhost:3000"
echo ""

# Wait for API to be ready
echo "🔍 Checking API availability..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/status > /dev/null 2>&1; then
        echo "✅ API is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API failed to start within 30 seconds"
        echo "📋 API log:"
        tail -n 10 full-stack.log 2>/dev/null || echo "No log file found"
        cleanup
        exit 1
    fi
    echo "   Waiting for API... ($i/30)"
    sleep 2
done

# Wait for frontend to be ready
echo "🔍 Checking frontend availability..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Frontend failed to start within 30 seconds"
        echo "📋 Frontend log:"
        tail -n 10 full-stack.log 2>/dev/null || echo "No log file found"
        cleanup
        exit 1
    fi
    echo "   Waiting for frontend... ($i/30)"
    sleep 2
done

echo ""
echo "🎉 All services are ready!"
echo "🧪 Starting Puppeteer tests..."
echo ""

# Run the Puppeteer tests
echo "📋 Running comprehensive tests..."
echo "   - API endpoint testing"
echo "   - Frontend navigation testing"
echo "   - React component testing"
echo "   - Responsive design testing"
echo "   - Performance testing"
echo "   - Screenshot capture"
echo ""

# Make test script executable
chmod +x "$TEST_SCRIPT"

# Run tests
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

# Cleanup
cleanup

# Exit with test result
exit $TEST_EXIT_CODE
