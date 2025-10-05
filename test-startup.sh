#!/bin/bash

# Test script to verify the startup script works correctly
echo "🧪 Testing AGoat Publisher Startup Script"
echo "=========================================="

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "air" 2>/dev/null || true
sleep 2

# Test authbind configuration
echo "🔧 Testing authbind configuration..."
if [ ! -f "/etc/authbind/byport/443" ]; then
    echo "❌ authbind not configured for port 443"
    exit 1
fi

if [ ! -x "/etc/authbind/byport/443" ]; then
    echo "❌ authbind port 443 file is not executable"
    exit 1
fi

echo "✅ authbind configured correctly"

# Test frontend startup
echo "🎨 Testing frontend startup on port 443..."
cd /projects/agoat-publisher/unified-app
authbind --deep timeout 10 npm run dev > test-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for startup
sleep 5

# Test if frontend is responding
if curl -s -k https://dev.np-topvitaminsupply.com > /dev/null 2>&1; then
    echo "✅ Frontend is responding on port 443"
else
    echo "❌ Frontend failed to start on port 443"
    echo "📋 Frontend log:"
    cat test-frontend.log
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Cleanup
kill $FRONTEND_PID 2>/dev/null || true
rm -f test-frontend.log

echo "🎉 All tests passed! The startup script should work correctly."
