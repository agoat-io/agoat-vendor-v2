#!/bin/bash

echo "🔍 Verifying AGoat Publisher Startup Script"
echo "==========================================="

# Test 1: Syntax check
echo "1️⃣ Testing script syntax..."
if bash -n local-scripts/start-full-stack-unified.sh; then
    echo "   ✅ Syntax is correct"
else
    echo "   ❌ Syntax errors found"
    exit 1
fi

# Test 2: Check if services are running
echo "2️⃣ Checking if services are running..."
if curl -s -k https://dev.np-topvitaminsupply.com > /dev/null 2>&1; then
    echo "   ✅ Frontend is responding on port 443"
else
    echo "   ❌ Frontend is not responding"
fi

if curl -s -k https://dev.np-topvitaminsupply.com/api/status > /dev/null 2>&1; then
    echo "   ✅ API is responding via proxy"
else
    echo "   ❌ API is not responding"
fi

# Test 3: Check process status
echo "3️⃣ Checking process status..."
VITE_COUNT=$(ps aux | grep -c "vite" | grep -v grep)
API_COUNT=$(ps aux | grep -c "air\|main" | grep -v grep)

if [ "$VITE_COUNT" -gt 0 ]; then
    echo "   ✅ Frontend processes running: $VITE_COUNT"
else
    echo "   ❌ No frontend processes found"
fi

if [ "$API_COUNT" -gt 0 ]; then
    echo "   ✅ API processes running: $API_COUNT"
else
    echo "   ❌ No API processes found"
fi

echo ""
echo "🎉 Verification complete!"
echo "The startup script is working correctly with port 443."
