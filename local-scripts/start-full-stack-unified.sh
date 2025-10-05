#!/bin/bash

# AGoat Publisher Unified Full Stack Development Startup Script
# Starts both the Go API server and the unified React.js frontend

echo "🚀 Starting AGoat Publisher Unified Full Stack Development Environment..."
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$PROJECT_ROOT/app-api"
UNIFIED_APP_DIR="$PROJECT_ROOT/unified-app"

echo "📁 Project root: $PROJECT_ROOT"
echo "🔧 API directory: $API_DIR"
echo "🎨 Unified App directory: $UNIFIED_APP_DIR"
echo ""

# Check if directories exist
if [ ! -d "$API_DIR" ]; then
    echo "❌ Error: API directory not found at $API_DIR"
    exit 1
fi

if [ ! -d "$UNIFIED_APP_DIR" ]; then
    echo "❌ Error: Unified App directory not found at $UNIFIED_APP_DIR"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed. Please install Google Cloud SDK first."
    exit 1
fi

# Check if user is authenticated with gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $API_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    # Also kill any existing processes to prevent duplicates
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "air" 2>/dev/null || true
    echo "✅ Services stopped"
    exit 0
}

# Function to cleanup existing processes before starting
cleanup_existing() {
    echo "🧹 Cleaning up any existing processes..."
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "air" 2>/dev/null || true
    sleep 2
    echo "✅ Cleanup completed"
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Clean up any existing processes first
cleanup_existing

# Clear Go build cache and temporary files
echo "🧹 Clearing Go build cache and temporary files..."
go clean -cache -modcache -i -r
rm -rf "$API_DIR/tmp/"
rm -rf "$API_DIR/*.log"
rm -rf "$API_DIR/air_tmp/"
echo "✅ API cache cleared"
echo ""

# Clear frontend cache
echo "🧹 Clearing frontend cache..."
rm -rf "$UNIFIED_APP_DIR/node_modules/.cache/"
rm -rf "$UNIFIED_APP_DIR/dist/"
rm -rf "$UNIFIED_APP_DIR/.vite/"
rm -rf "$UNIFIED_APP_DIR/*.log"
echo "✅ Frontend cache cleared"
echo ""

# GCP project configuration
export gcp_project="agoat-publisher-dev"
echo "☁️  Using GCP project: $gcp_project"

# Load secrets from GCP
echo "🔐 Loading secrets from GCP..."
export db1_secret_name_ca="agoat-publisher-db-main-cockroach-ca"
export db1_secret_name_dsn="agoat-publisher-db-main-cockroach-dsn"

export CA="$(gcloud secrets versions access latest --secret="$db1_secret_name_ca" --project="$gcp_project")"
export DSN="$(gcloud secrets versions access latest --secret="$db1_secret_name_dsn" --project="$gcp_project")"

echo "✅ Secrets loaded successfully"
echo ""

# Check if frontend dependencies are installed
if [ ! -d "$UNIFIED_APP_DIR/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd "$UNIFIED_APP_DIR"
    npm install
    cd "$PROJECT_ROOT"
fi

# Start API server in background
echo "🌐 Starting API server on http://localhost:8080..."
cd "$API_DIR"

# Check if air is installed for hot reload
AIR_PATH="$HOME/go/bin/air"
if [ -f "$AIR_PATH" ]; then
    echo "🔥 Starting API with hot reload (air)"
    "$AIR_PATH" > api.log 2>&1 &
else
    echo "📦 Installing air for hot reload..."
    go install github.com/air-verse/air@latest
    echo "🔥 Starting API with hot reload (air)"
    "$HOME/go/bin/air" > api.log 2>&1 &
fi

API_PID=$!
echo "✅ API server started (PID: $API_PID)"
echo ""

# Wait a moment for API to start
sleep 3

# Check if API is running
if ! curl -s http://localhost:8080/api/status > /dev/null; then
    echo "⚠️  Warning: API server may not be fully started yet"
    echo "📋 API log:"
    tail -n 5 "$API_DIR/api.log" 2>/dev/null || echo "No log file found"
    echo ""
fi

# Check authbind configuration for port 443
echo "🔧 Checking authbind configuration for port 443..."
if [ ! -f "/etc/authbind/byport/443" ]; then
    echo "❌ Error: authbind not configured for port 443"
    echo "   Please run: sudo touch /etc/authbind/byport/443 && sudo chmod 500 /etc/authbind/byport/443 && sudo chown $(whoami) /etc/authbind/byport/443"
    exit 1
fi

if [ ! -x "/etc/authbind/byport/443" ]; then
    echo "❌ Error: authbind port 443 file is not executable"
    echo "   Please run: sudo chmod 500 /etc/authbind/byport/443"
    exit 1
fi

echo "✅ authbind configured for port 443"

# Start frontend in background
echo "🎨 Starting Unified App frontend on https://dev.np-topvitaminsupply.com (port 443)..."
cd "$UNIFIED_APP_DIR"

# Clear any existing frontend log
> frontend.log

# Start with authbind to allow port 443 binding
authbind --deep npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"
echo ""

# Wait for frontend to start with better checking
echo "⏳ Waiting for frontend to start on port 443..."
for i in {1..30}; do
    if curl -s -k https://dev.np-topvitaminsupply.com > /dev/null 2>&1; then
        echo "✅ Frontend is responding on port 443!"
        break
    fi
    
    # Check if process is still running
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend process died unexpectedly"
        echo "📋 Frontend log:"
        cat "$UNIFIED_APP_DIR/frontend.log" 2>/dev/null || echo "No log file found"
        exit 1
    fi
    
    echo "   Attempt $i/30: Still waiting..."
    sleep 2
done

# Final check
if ! curl -s -k https://dev.np-topvitaminsupply.com > /dev/null 2>&1; then
    echo "⚠️  Warning: Frontend may not be fully started yet"
    echo "📋 Frontend log:"
    tail -n 10 "$UNIFIED_APP_DIR/frontend.log" 2>/dev/null || echo "No log file found"
    echo ""
fi

# Display status
echo "🎉 AGoat Publisher Unified Full Stack Development Environment is running!"
echo ""
echo "📊 Service Status:"
echo "   🌐 API Server:     https://dev.np-topvitaminsupply.com:8080 (PID: $API_PID)"
echo "   🎨 Frontend:       https://dev.np-topvitaminsupply.com (PID: $FRONTEND_PID)"
echo "   📋 API Logs:       $API_DIR/api.log"
echo "   📋 Frontend Logs:  $UNIFIED_APP_DIR/frontend.log"
echo ""
echo "🔗 Quick Links:"
echo "   📖 Blog Home:      https://dev.np-topvitaminsupply.com"
echo "   🔐 Login:          https://dev.np-topvitaminsupply.com/login"
echo "   📊 Dashboard:      https://dev.np-topvitaminsupply.com/dashboard"
echo "   ✏️  New Post:       https://dev.np-topvitaminsupply.com/new-post"
echo ""
echo "💡 Features:"
echo "   ✅ Single React.js application (no Module Federation)"
echo "   ✅ Modern Vite build system"
echo "   ✅ Radix UI components with Tailwind CSS"
echo "   ✅ Full blog functionality"
echo "   ✅ User authentication"
echo "   ✅ Markdown support with DOMPurify sanitization"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait
