#!/bin/bash

# AGoat Publisher - Complete Schema Application Script
# This script applies the complete database schema to a fresh database

echo "🔧 AGoat Publisher - Complete Schema Application"
echo "================================================"

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_DIR="$PROJECT_ROOT/app-api-database-schema"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Schema directory: $SCHEMA_DIR"
echo ""

# Check if schema file exists
SCHEMA_FILE="$SCHEMA_DIR/complete-schema.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Error: Complete schema file not found at $SCHEMA_FILE"
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

# Check if psql is available (for direct database connection)
if command -v psql &> /dev/null; then
    echo "🐘 Using psql for schema application..."
    
    # Apply schema using psql
    echo "📝 Applying complete schema to database..."
    if psql "$DSN" -f "$SCHEMA_FILE"; then
        echo "✅ Schema applied successfully!"
    else
        echo "❌ Error: Failed to apply schema"
        exit 1
    fi
    
elif command -v cockroach &> /dev/null; then
    echo "🪳 Using CockroachDB CLI for schema application..."
    
    # Apply schema using cockroach sql
    echo "📝 Applying complete schema to database..."
    if cockroach sql --url="$DSN" -f "$SCHEMA_FILE"; then
        echo "✅ Schema applied successfully!"
    else
        echo "❌ Error: Failed to apply schema"
        exit 1
    fi
    
else
    echo "❌ Error: Neither psql nor cockroach CLI found."
    echo "Please install PostgreSQL client tools or CockroachDB CLI."
    echo ""
    echo "To install PostgreSQL client:"
    echo "  brew install postgresql"
    echo ""
    echo "To install CockroachDB CLI:"
    echo "  curl -sSfL https://binaries.cockroachdb.com/cockroach-v23.1.0.darwin-10.9-amd64.tgz | tar -xz"
    echo "  sudo cp cockroach-v23.1.0.darwin-10.9-amd64/cockroach /usr/local/bin/"
    exit 1
fi

echo ""
echo "🎉 Complete schema has been applied successfully!"
echo ""
echo "📊 Database now includes:"
echo "   ✅ Base tables (users, posts)"
echo "   ✅ Multitenancy support (customers, sites, domains)"
echo "   ✅ IAM integration (providers, mappings)"
echo "   ✅ Audit logging and usage tracking"
echo "   ✅ Optimized indexes for CockroachDB"
echo "   ✅ Default customer and site setup"
echo ""
echo "🔧 Next steps:"
echo "   1. Verify the schema: ./tools/dbmigrate/start-migration.sh status"
echo "   2. Start your applications"
echo "   3. Configure IAM providers as needed"
echo ""
