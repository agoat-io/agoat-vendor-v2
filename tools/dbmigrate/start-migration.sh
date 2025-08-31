#!/bin/bash

# AGoat Publisher Database Migration Tool Startup Script

echo "🔧 Starting AGoat Publisher Database Migration Tool..."

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATION_DIR="$PROJECT_ROOT/tools/dbmigrate"

echo "📁 Project root: $PROJECT_ROOT"
echo "🔧 Migration tool directory: $MIGRATION_DIR"
echo ""

# Check if directories exist
if [ ! -d "$MIGRATION_DIR" ]; then
    echo "❌ Error: Migration tool directory not found at $MIGRATION_DIR"
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

# Clear Go build cache and temporary files
echo "🧹 Clearing Go build cache and temporary files..."
go clean -cache -modcache -i -r
rm -rf "$MIGRATION_DIR/tmp/"
rm -rf "$MIGRATION_DIR/*.log"
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

echo "🔐 Secrets loaded from GCP"
echo ""

# Change to migration tool directory
cd "$MIGRATION_DIR"

# Build the migration tool
echo "🔨 Building migration tool..."
if ! go build -o dbmigrate main.go; then
    echo "❌ Error: Failed to build migration tool"
    exit 1
fi
echo "✅ Migration tool built successfully"
echo ""

# Show usage information
echo "📖 Migration Tool Usage:"
echo "========================"
echo "./dbmigrate status                    # Show current migration status"
echo "./dbmigrate up                        # Apply all pending migrations"
echo "./dbmigrate up -version 5             # Apply migrations up to version 5"
echo "./dbmigrate down -version 3           # Rollback migrations down to version 3"
echo "./dbmigrate create add_new_table      # Create a new migration file"
echo "./dbmigrate validate                  # Validate migration files"
echo "./dbmigrate reset -dry-run            # Reset database (dry run)"
echo "./dbmigrate -help                     # Show full help"
echo ""

# If arguments provided, run the migration tool
if [ $# -gt 0 ]; then
    echo "🚀 Running migration tool with arguments: $@"
    echo ""
    ./dbmigrate "$@"
else
    echo "💡 No arguments provided. Run './dbmigrate -help' for usage information."
    echo "💡 Example: './dbmigrate status' to check current migration status."
fi
