#!/bin/bash

# AGoat Publisher - Flyway Schema Migration Integration
# This script integrates Flyway schema migration with the existing migration tool
# Flyway is completely free and open source (Apache 2.0)

echo "🦅 AGoat Publisher - Flyway Schema Migration Tool"
echo "================================================="

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCHEMA_DIFF_DIR="$PROJECT_ROOT/tools/schema-diff"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Schema diff directory: $SCHEMA_DIFF_DIR"
echo ""

# Check if Flyway is installed
if ! command -v flyway &> /dev/null; then
    echo "❌ Error: Flyway is not installed."
    echo ""
    echo "📦 Installation (completely free):"
    echo "   brew install flyway"
    echo "   # or download from https://flywaydb.org/download"
    echo ""
    echo "🎯 Why Flyway:"
    echo "   ✅ 100% Free & Open Source (Apache 2.0)"
    echo "   ✅ SQL-first approach"
    echo "   ✅ Excellent CockroachDB support"
    echo "   ✅ Mature and stable"
    echo "   ✅ Version control integration"
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

# Create Flyway configuration
create_flyway_config() {
    local config_file="$SCHEMA_DIFF_DIR/flyway.conf"
    
    cat > "$config_file" << EOF
# Flyway Configuration for AGoat Publisher
flyway.url=$DSN
flyway.user=$(echo $DSN | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
flyway.password=$(echo $DSN | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
flyway.locations=filesystem:$SCHEMA_DIFF_DIR/migrations
flyway.sqlMigrationPrefix=V
flyway.sqlMigrationSeparator=__
flyway.sqlMigrationSuffixes=.sql
flyway.validateOnMigrate=true
flyway.cleanDisabled=false
flyway.baselineOnMigrate=true
flyway.baselineVersion=0
flyway.encoding=UTF-8
flyway.placeholderReplacement=false
EOF

    echo "✅ Flyway configuration created: $config_file"
}

# Parse command line arguments
ACTION=${1:-"help"}
SOURCE_DB=${2:-""}
TARGET_DB=${3:-""}

case $ACTION in
    "setup")
        echo "🔧 Setting up Flyway for AGoat Publisher..."
        
        # Create directories
        mkdir -p "$SCHEMA_DIFF_DIR/migrations"
        mkdir -p "$SCHEMA_DIFF_DIR/output"
        
        # Create Flyway configuration
        create_flyway_config
        
        # Create initial migration if it doesn't exist
        if [ ! -f "$SCHEMA_DIFF_DIR/migrations/V1__Initial_schema.sql" ]; then
            cat > "$SCHEMA_DIFF_DIR/migrations/V1__Initial_schema.sql" << 'EOF'
-- Initial schema for AGoat Publisher
-- This migration creates the base schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);
EOF
            echo "✅ Initial migration created: V1__Initial_schema.sql"
        fi
        
        echo "✅ Flyway setup completed!"
        echo ""
        echo "📁 Migration directory: $SCHEMA_DIFF_DIR/migrations"
        echo "📄 Config file: $SCHEMA_DIFF_DIR/flyway.conf"
        ;;
        
    "status")
        echo "📊 Checking Flyway migration status..."
        
        # Create config if it doesn't exist
        if [ ! -f "$SCHEMA_DIFF_DIR/flyway.conf" ]; then
            create_flyway_config
        fi
        
        # Run Flyway info
        flyway -configFiles="$SCHEMA_DIFF_DIR/flyway.conf" info
        ;;
        
    "migrate")
        echo "🚀 Running Flyway migrations..."
        
        # Create config if it doesn't exist
        if [ ! -f "$SCHEMA_DIFF_DIR/flyway.conf" ]; then
            create_flyway_config
        fi
        
        # Run Flyway migrate
        flyway -configFiles="$SCHEMA_DIFF_DIR/flyway.conf" migrate
        
        if [ $? -eq 0 ]; then
            echo "✅ Migrations completed successfully!"
        else
            echo "❌ Migration failed!"
            exit 1
        fi
        ;;
        
    "create-migration")
        if [ -z "$SOURCE_DB" ]; then
            echo "❌ Error: Migration name is required."
            echo "Usage: $0 create-migration <migration_name>"
            exit 1
        fi
        
        MIGRATION_NAME=${SOURCE_DB}
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        MIGRATION_FILE="V${TIMESTAMP}__${MIGRATION_NAME}.sql"
        
        echo "📝 Creating new migration: $MIGRATION_FILE"
        
        # Create migration file
        cat > "$SCHEMA_DIFF_DIR/migrations/$MIGRATION_FILE" << EOF
-- Migration: $MIGRATION_NAME
-- Date: $(date)
-- Description: $MIGRATION_NAME

-- Add your SQL migration here
-- Example:
-- CREATE TABLE new_table (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
-- );

EOF
        
        echo "✅ Migration file created: $MIGRATION_FILE"
        echo "📁 Location: $SCHEMA_DIFF_DIR/migrations/$MIGRATION_FILE"
        ;;
        
    "compare")
        if [ -z "$SOURCE_DB" ] || [ -z "$TARGET_DB" ]; then
            echo "❌ Error: Both source and target database URLs are required."
            echo "Usage: $0 compare <source_db_url> <target_db_url>"
            exit 1
        fi
        
        echo "🔍 Comparing schemas with Flyway..."
        echo "Source: $SOURCE_DB"
        echo "Target: $TARGET_DB"
        echo ""
        
        # Create temporary Flyway configs for comparison
        SOURCE_CONFIG="$SCHEMA_DIFF_DIR/temp_source.conf"
        TARGET_CONFIG="$SCHEMA_DIFF_DIR/temp_target.conf"
        
        # Source config
        cat > "$SOURCE_CONFIG" << EOF
flyway.url=$SOURCE_DB
flyway.user=$(echo $SOURCE_DB | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
flyway.password=$(echo $SOURCE_DB | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
flyway.locations=filesystem:$SCHEMA_DIFF_DIR/migrations
flyway.validateOnMigrate=false
flyway.baselineOnMigrate=true
EOF

        # Target config
        cat > "$TARGET_CONFIG" << EOF
flyway.url=$TARGET_DB
flyway.user=$(echo $TARGET_DB | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
flyway.password=$(echo $TARGET_DB | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
flyway.locations=filesystem:$SCHEMA_DIFF_DIR/migrations
flyway.validateOnMigrate=false
flyway.baselineOnMigrate=true
EOF

        # Get migration info from both databases
        echo "📊 Source database migration status:"
        flyway -configFiles="$SOURCE_CONFIG" info
        
        echo ""
        echo "📊 Target database migration status:"
        flyway -configFiles="$TARGET_CONFIG" info
        
        # Clean up temp configs
        rm -f "$SOURCE_CONFIG" "$TARGET_CONFIG"
        
        echo ""
        echo "✅ Schema comparison completed!"
        ;;
        
    "clean")
        echo "🧹 Cleaning database (WARNING: This will drop all tables!)"
        echo "Are you sure you want to continue? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            flyway -configFiles="$SCHEMA_DIFF_DIR/flyway.conf" clean
            echo "✅ Database cleaned!"
        else
            echo "❌ Clean operation cancelled."
        fi
        ;;
        
    "repair")
        echo "🔧 Repairing Flyway schema history..."
        flyway -configFiles="$SCHEMA_DIFF_DIR/flyway.conf" repair
        echo "✅ Schema history repaired!"
        ;;
        
    "validate")
        echo "🔍 Validating migrations..."
        flyway -configFiles="$SCHEMA_DIFF_DIR/flyway.conf" validate
        echo "✅ Migration validation completed!"
        ;;
        
    "info")
        echo "📊 Migration information..."
        flyway -configFiles="$SCHEMA_DIFF_DIR/flyway.conf" info
        ;;
        
    "help"|*)
        echo "📖 Flyway Schema Migration Tool Usage"
        echo "===================================="
        echo ""
        echo "Usage: $0 <action> [options]"
        echo ""
        echo "Actions:"
        echo "  setup                    Setup Flyway for the project"
        echo "  status                   Check migration status"
        echo "  migrate                  Run pending migrations"
        echo "  create-migration <name>  Create a new migration file"
        echo "  compare <source> <target> Compare two database schemas"
        echo "  clean                    Clean database (WARNING: drops all tables)"
        echo "  repair                   Repair schema history"
        echo "  validate                 Validate migrations"
        echo "  info                     Show migration information"
        echo "  help                     Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 setup"
        echo "  $0 status"
        echo "  $0 migrate"
        echo "  $0 create-migration add_users_table"
        echo "  $0 compare postgresql://dev:5432/db postgresql://prod:5432/db"
        echo "  $0 validate"
        echo ""
        echo "Migration Files:"
        echo "  Flyway uses the naming convention: V<version>__<description>.sql"
        echo "  Example: V1__Initial_schema.sql, V2__Add_users_table.sql"
        echo ""
        echo "Current database: $DSN"
        echo ""
        echo "🎯 Why Flyway:"
        echo "  ✅ 100% Free & Open Source (Apache 2.0)"
        echo "  ✅ SQL-first approach"
        echo "  ✅ Excellent CockroachDB support"
        echo "  ✅ Mature and stable"
        echo "  ✅ Version control integration"
        ;;
esac

echo ""
echo "🎉 Flyway schema migration tool completed!"
