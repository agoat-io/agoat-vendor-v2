#!/bin/bash

# agoat-publisher Admin Testing Script
# Follows work rules: headless mode, screenshots, JS error detection

set -e

echo "=== agoat-publisher Admin Testing Suite ==="
echo "Following work rules: headless mode, screenshots, JS error detection"
echo ""

# Check if email is provided
if [ -z "$1" ]; then
    echo "❌ Error: Email is required"
    echo "Usage: $0 <email>"
    echo "Example: $0 admin@example.com"
    exit 1
fi

EMAIL="$1"
echo "📧 Testing with email: $EMAIL"
echo "🔒 Password: Bremi-turp-443@"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is required but not installed"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is required but not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install Playwright Chromium if needed
echo "🎭 Installing Playwright Chromium..."
npx playwright install chromium

# Create screenshot directory
SCREENSHOT_DIR="/media/psf/projects/03-project-management-common/agoat-publisher-e2e-images"
echo "📸 Creating screenshot directory: $SCREENSHOT_DIR"
mkdir -p "$SCREENSHOT_DIR"

# Check if the app is running
echo "🔍 Checking if agoat-publisher is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ agoat-publisher is running on http://localhost:3000"
else
    echo "⚠️ agoat-publisher might not be running on http://localhost:3000"
    echo "Please ensure the app is started with:"
    echo "cd /projects/agoat-publisher && ./local-scripts/start-full-stack-unified.sh"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Starting comprehensive admin testing..."
echo "📋 Test plan:"
echo "  1. Navigate to login page"
echo "  2. Enter email: $EMAIL"
echo "  3. Click 'Try another way' to show password field"
echo "  4. Enter password: Bremi-turp-443@"
echo "  5. Submit login form"
echo "  6. Test all admin screens and functionality"
echo "  7. Take screenshots of all changes and fixes"
echo "  8. Detect and report JavaScript errors"
echo "  9. Generate comprehensive reports"
echo ""

# Run the test suite
node playwright-admin-test-suite.js "$EMAIL"

echo ""
echo "=== Testing Complete ==="
echo "📊 Check the following files for results:"
echo "  - admin-test-report.json (detailed JSON report)"
echo "  - admin-test-summary.txt (summary report)"
echo "  - $SCREENSHOT_DIR/ (screenshots of all changes and fixes)"
echo ""
echo "🔍 Key features tested:"
echo "  ✅ Login flow with email and password"
echo "  ✅ Admin navigation and menus"
echo "  ✅ All forms and input fields"
echo "  ✅ All buttons and actions"
echo "  ✅ Admin screens and sections"
echo "  ✅ File upload functionality"
echo "  ✅ JavaScript error detection"
echo "  ✅ Screenshots of all changes"
echo ""
echo "📋 Following work rules:"
echo "  ✅ Headless mode (no browser popup)"
echo "  ✅ Screenshots saved to designated directory"
echo "  ✅ JavaScript errors detected and reported"
echo "  ✅ Server-side logs can be checked for troubleshooting"
echo "  ✅ Non-browser based reports generated"
