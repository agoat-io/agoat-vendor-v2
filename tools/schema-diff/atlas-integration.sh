#!/bin/bash

# AGoat Publisher - Atlas Schema Comparison Integration
# This script integrates Atlas schema comparison with the existing migration tool
# Atlas is completely free and open source (Apache 2.0)

echo "🔍 AGoat Publisher - Atlas Schema Comparison Tool"
echo "================================================="

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCHEMA_DIFF_DIR="$PROJECT_ROOT/tools/schema-diff"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Schema diff directory: $SCHEMA_DIFF_DIR"
echo ""

# Check if Atlas is installed
if ! command -v atlas &> /dev/null; then
    echo "❌ Error: Atlas is not installed."
    echo ""
    echo "📦 Installation (completely free):"
    echo "   curl -sSf https://atlasgo.io/install.sh | sh"
    echo "   # or visit: https://atlasgo.io/getting-started"
    echo ""
    echo "🎯 Why Atlas:"
    echo "   ✅ 100% Free & Open Source (Apache 2.0)"
    echo "   ✅ Go-based (like your project)"
    echo "   ✅ Excellent CockroachDB support"
    echo "   ✅ Built-in schema comparison"
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

# Parse command line arguments
ACTION=${1:-"help"}
SOURCE_DB=${2:-""}
TARGET_DB=${3:-""}

case $ACTION in
    "compare")
        if [ -z "$SOURCE_DB" ] || [ -z "$TARGET_DB" ]; then
            echo "❌ Error: Both source and target database URLs are required."
            echo "Usage: $0 compare <source_db_url> <target_db_url>"
            exit 1
        fi
        
        echo "🔍 Comparing schemas with Atlas..."
        echo "Source: $SOURCE_DB"
        echo "Target: $TARGET_DB"
        echo ""
        
        # Create output directory
        mkdir -p "$SCHEMA_DIFF_DIR/output"
        
        # Run Atlas schema diff
        atlas schema diff \
            --from "$SOURCE_DB" \
            --to "$TARGET_DB" \
            --dev-url "$DSN" \
            --format "{{ sql . \"  \" }}" \
            > "$SCHEMA_DIFF_DIR/output/schema_diff.sql"
        
        if [ $? -eq 0 ]; then
            echo "✅ Schema comparison completed!"
            echo "📄 Output file: $SCHEMA_DIFF_DIR/output/schema_diff.sql"
            
            # Show the diff
            if [ -s "$SCHEMA_DIFF_DIR/output/schema_diff.sql" ]; then
                echo ""
                echo "📋 Schema differences:"
                echo "===================="
                cat "$SCHEMA_DIFF_DIR/output/schema_diff.sql"
            else
                echo "ℹ️  No schema differences found."
            fi
        else
            echo "❌ Schema comparison failed!"
            exit 1
        fi
        ;;
        
    "generate-migration")
        if [ -z "$SOURCE_DB" ]; then
            echo "❌ Error: Source database URL is required."
            echo "Usage: $0 generate-migration <source_db_url> [migration_name]"
            exit 1
        fi
        
        MIGRATION_NAME=${TARGET_DB:-"schema_update_$(date +%Y%m%d_%H%M%S)"}
        
        echo "🔧 Generating migration from schema changes..."
        echo "Source: $SOURCE_DB"
        echo "Migration name: $MIGRATION_NAME"
        echo ""
        
        # Create output directory
        mkdir -p "$SCHEMA_DIFF_DIR/output"
        
        # Run Atlas schema diff against current database
        atlas schema diff \
            --from "$SOURCE_DB" \
            --to "$DSN" \
            --dev-url "$DSN" \
            --format "{{ sql . \"  \" }}" \
            > "$SCHEMA_DIFF_DIR/output/${MIGRATION_NAME}.sql"
        
        if [ $? -eq 0 ]; then
            echo "✅ Migration generated!"
            echo "📄 Output file: $SCHEMA_DIFF_DIR/output/${MIGRATION_NAME}.sql"
            
            # Copy to migration tool if it's a valid migration
            if [ -s "$SCHEMA_DIFF_DIR/output/${MIGRATION_NAME}.sql" ]; then
                echo "📋 Copying to migration tool..."
                cp "$SCHEMA_DIFF_DIR/output/${MIGRATION_NAME}.sql" \
                   "$PROJECT_ROOT/tools/dbmigrate/migrations/"
                echo "✅ Migration copied to tools/dbmigrate/migrations/"
                
                # Show the migration
                echo ""
                echo "📋 Generated migration:"
                echo "======================"
                cat "$SCHEMA_DIFF_DIR/output/${MIGRATION_NAME}.sql"
            else
                echo "ℹ️  No schema changes detected."
            fi
        else
            echo "❌ Migration generation failed!"
            exit 1
        fi
        ;;
        
    "validate")
        echo "🔍 Validating current schema with Atlas..."
        
        # Create Atlas schema snapshot
        atlas schema inspect \
            --url "$DSN" \
            --format "{{ sql . \"  \" }}" \
            > "$SCHEMA_DIFF_DIR/output/current_schema.sql"
        
        if [ $? -eq 0 ]; then
            echo "✅ Schema validation completed!"
            echo "📄 Schema snapshot: $SCHEMA_DIFF_DIR/output/current_schema.sql"
            
            # Show schema summary
            echo ""
            echo "📊 Schema Summary:"
            echo "=================="
            atlas schema inspect --url "$DSN" --format "{{ range .Tables }}{{ .Name }}{{ \"\n\" }}{{ end }}"
        else
            echo "❌ Schema validation failed!"
            exit 1
        fi
        ;;
        
    "apply-diff")
        DIFF_FILE=${2:-"$SCHEMA_DIFF_DIR/output/schema_diff.sql"}
        
        if [ ! -f "$DIFF_FILE" ]; then
            echo "❌ Error: Diff file not found: $DIFF_FILE"
            echo "Usage: $0 apply-diff [diff_file_path]"
            exit 1
        fi
        
        echo "🚀 Applying schema diff..."
        echo "File: $DIFF_FILE"
        echo ""
        
        # Apply the diff using your migration tool
        cd "$PROJECT_ROOT"
        ./tools/dbmigrate/start-migration.sh up
        
        if [ $? -eq 0 ]; then
            echo "✅ Schema diff applied successfully!"
        else
            echo "❌ Failed to apply schema diff!"
            exit 1
        fi
        ;;
        
    "inspect")
        echo "🔍 Inspecting current database schema..."
        
        # Show detailed schema information
        echo "📊 Database Tables:"
        echo "=================="
        atlas schema inspect --url "$DSN" --format "{{ range .Tables }}{{ .Name }}{{ \"\n\" }}{{ end }}"
        
        echo ""
        echo "📊 Detailed Schema:"
        echo "=================="
        atlas schema inspect --url "$DSN" --format "{{ sql . \"  \" }}"
        ;;
        
    "help"|*)
        echo "📖 Atlas Schema Comparison Tool Usage"
        echo "===================================="
        echo ""
        echo "Usage: $0 <action> [options]"
        echo ""
        echo "Actions:"
        echo "  compare <source_db> <target_db>     Compare two database schemas"
        echo "  generate-migration <source_db> [name] Generate migration from schema changes"
        echo "  validate                            Validate current schema"
        echo "  inspect                             Inspect current database schema"
        echo "  apply-diff [diff_file]              Apply generated diff using migration tool"
        echo "  help                                Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 compare postgresql://dev:5432/db postgresql://prod:5432/db"
        echo "  $0 generate-migration postgresql://staging:5432/db add_users_table"
        echo "  $0 validate"
        echo "  $0 inspect"
        echo "  $0 apply-diff output/schema_diff.sql"
        echo ""
        echo "Database URLs:"
        echo "  Use PostgreSQL connection strings:"
        echo "  postgresql://username:password@host:port/database"
        echo ""
        echo "Current database: $DSN"
        echo ""
        echo "🎯 Why Atlas:"
        echo "  ✅ 100% Free & Open Source (Apache 2.0)"
        echo "  ✅ Go-based (like your project)"
        echo "  ✅ Excellent CockroachDB support"
        echo "  ✅ Built-in schema comparison"
        echo "  ✅ Modern and actively maintained"
        ;;
esac

echo ""
echo "🎉 Atlas schema comparison tool completed!"
