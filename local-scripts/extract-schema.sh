#!/bin/bash

# AGoat Publisher Database Schema Extraction Script

echo "🔍 Starting AGoat Publisher Database Schema Extraction..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_DIR="$PROJECT_ROOT/app-api-database-schema"

echo "📁 Project root: $PROJECT_ROOT"
echo "🔍 Schema directory: $SCHEMA_DIR"
echo ""

# Check if directories exist
if [ ! -d "$SCHEMA_DIR" ]; then
    echo "❌ Error: Schema directory not found at $SCHEMA_DIR"
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

# Load secrets from GCP
echo "🔐 Loading secrets from GCP..."
echo "📝 Note: You may be prompted to confirm the GCP project and secrets access."
echo ""

# GCP project configuration
gcp_project="agoat-publisher-dev"
echo "☁️  Using GCP project: $gcp_project"

# Load secrets from GCP
db1_secret_name_ca="agoat-publisher-db-main-cockroach-ca"
db1_secret_name_dsn="agoat-publisher-db-main-cockroach-dsn"

export CA="$(gcloud secrets versions access latest --secret="$db1_secret_name_ca" --project="$gcp_project")"
export DSN="$(gcloud secrets versions access latest --secret="$db1_secret_name_dsn" --project="$gcp_project")"

echo "✅ Secrets loaded successfully"
echo ""

# Run the schema extraction tool
echo "🔍 Extracting database schema..."
cd "$SCHEMA_DIR"

# Ensure Go modules are up to date
echo "📦 Updating Go modules..."
go mod tidy

# Run the extraction tool
echo "🚀 Running schema extraction..."
go run extract-schema.go

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema extraction completed successfully!"
    echo "📁 Generated files:"
    echo "   - extracted-schema.json (Machine-readable schema)"
    echo "   - extracted-schema.sql (SQL CREATE statements)"
    echo "   - EXTRACTED-SCHEMA.md (Human-readable documentation)"
    echo ""
    echo "📂 Files are located in: $SCHEMA_DIR"
else
    echo ""
    echo "❌ Schema extraction failed!"
    echo "💡 Make sure:"
    echo "   1. CockroachDB is running on port 26257"
    echo "   2. The 'blog' database exists"
    echo "   3. Your API has been run at least once to create the schema"
    exit 1
fi
