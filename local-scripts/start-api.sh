#!/bin/bash

# AGoat Publisher Go API Development Startup Script

echo "🔧 Starting AGoat Publisher Go API Server..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$PROJECT_ROOT/app-api"

echo "📁 Project root: $PROJECT_ROOT"
echo "🔧 API directory: $API_DIR"
echo ""

# Check if directories exist
if [ ! -d "$API_DIR" ]; then
    echo "❌ Error: API directory not found at $API_DIR"
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

# Start API with GCP secrets loading
echo "🌐 Starting API on http://localhost:8080"
echo "🔐 Loading secrets from GCP..."
echo "📝 Note: You may be prompted to confirm the GCP project and secrets access."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd "$PROJECT_ROOT"

# Clear Go build cache and temporary files
echo "🧹 Clearing Go build cache and temporary files..."
go clean -cache -modcache -i -r
rm -rf "$API_DIR/tmp/"
rm -rf "$API_DIR/*.log"
rm -rf "$API_DIR/air_tmp/"
echo "✅ Cache cleared"
echo ""

# GCP project configuration
gcp_project="agoat-publisher-dev"
echo "☁️  Using GCP project: $gcp_project"

# Load secrets from GCP
db1_secret_name_ca="agoat-publisher-db-main-cockroach-ca"
db1_secret_name_dsn="agoat-publisher-db-main-cockroach-dsn"

export CA="$(gcloud secrets versions access latest --secret="$db1_secret_name_ca" --project="$gcp_project")"
export DSN="$(gcloud secrets versions access latest --secret="$db1_secret_name_dsn" --project="$gcp_project")"

# Check if air is installed for hot reload
AIR_PATH="$HOME/go/bin/air"
if [ -f "$AIR_PATH" ]; then
    echo "🔥 Starting API with hot reload (air)"
    cd "$API_DIR"
    "$AIR_PATH"
else
    echo "📦 Installing air for hot reload..."
    go install github.com/air-verse/air@latest
    echo "🔥 Starting API with hot reload (air)"
    cd "$API_DIR"
    "$HOME/go/bin/air"
fi
