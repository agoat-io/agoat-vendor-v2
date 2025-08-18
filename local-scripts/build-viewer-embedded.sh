#!/bin/bash

# Build and embed the viewer microfrontend into the main app
echo "Building and embedding AGoat Publisher Viewer..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VIEWER_DIR="$PROJECT_ROOT/app-vue-ui-viewer"
UI_DIR="$PROJECT_ROOT/app-vue-ui"

echo "📁 Project root: $PROJECT_ROOT"
echo "👁️  Viewer directory: $VIEWER_DIR"
echo "🎨 UI directory: $UI_DIR"
echo ""

# Check if directories exist
if [ ! -d "$VIEWER_DIR" ]; then
    echo "❌ Error: Viewer directory not found at $VIEWER_DIR"
    exit 1
fi

if [ ! -d "$UI_DIR" ]; then
    echo "❌ Error: UI directory not found at $UI_DIR"
    exit 1
fi

# Navigate to viewer directory and build
echo "🔨 Building viewer microfrontend..."
cd "$VIEWER_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing viewer dependencies..."
    npm install
fi

# Build the viewer
echo "🏗️  Building viewer..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to build viewer"
    exit 1
fi

# Create viewer directory in UI public folder
echo "📁 Creating viewer directory in UI public folder..."
mkdir -p "$UI_DIR/public/viewer"

# Copy built files to UI public directory
echo "📋 Copying built files..."
cp -r "$VIEWER_DIR/dist/"* "$UI_DIR/public/viewer/"

# Create a simple index.html for the viewer
echo "📄 Creating viewer index.html..."
cat > "$UI_DIR/public/viewer/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AGoat Publisher Viewer</title>
    <link rel="stylesheet" href="./agoat-publisher-viewer.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="./agoat-publisher-viewer.js"></script>
</body>
</html>
EOF

echo "✅ Viewer embedded successfully!"
echo "📊 Viewer is now available at: http://localhost:5173/viewer/"
echo "🎯 Main app can now load viewer from same origin"
echo ""
echo "💡 To use the embedded viewer, update ViewerMicrofrontend.vue to use:"
echo "   viewerUrl: '/viewer/'"
echo ""
echo "🔄 Run this script again whenever you make changes to the viewer"
