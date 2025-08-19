#!/bin/bash

# Rebuild the viewer microfrontend
echo "🔄 Rebuilding AGoat Publisher Viewer..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# Run the build script
./local-scripts/build-viewer-embedded.sh

echo ""
echo "✅ Viewer rebuilt successfully!"
echo "🔄 Changes are now available at http://localhost:5173/viewer/"

