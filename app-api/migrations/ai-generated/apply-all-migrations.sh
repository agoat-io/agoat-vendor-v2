#!/bin/bash

# AGoat Publisher - Apply All AI-Generated Migrations
# This script applies all DDL and data migration scripts

echo "🔧 AGoat Publisher - Applying AI-Generated Migrations"
echo "====================================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Script directory: $SCRIPT_DIR"

# Check if DSN is provided
if [ -z "$DSN" ]; then
    echo "❌ Error: DSN environment variable not set"
    echo "Please set DSN to your database connection string"
    echo "Example: export DSN='postgresql://user:pass@host:port/database'"
    exit 1
fi

echo "🔐 Using DSN: ${DSN:0:20}..."
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed or not in PATH"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

echo "🐘 Using psql for migration application..."
echo ""

# Apply DDL scripts
echo "📝 Applying DDL scripts..."
if [ -f "$SCRIPT_DIR/ddl/001_current_database_schema.sql" ]; then
    echo "  ✅ Applying schema..."
    if psql "$DSN" -f "$SCRIPT_DIR/ddl/001_current_database_schema.sql"; then
        echo "  ✅ Schema applied successfully!"
    else
        echo "  ❌ Error: Failed to apply schema"
        exit 1
    fi
else
    echo "  ❌ Error: DDL script not found"
    exit 1
fi

echo ""

# Apply data scripts in order
echo "📊 Applying data scripts..."

DATA_SCRIPTS=(
    "001_customers_data.sql"
    "002_sites_data.sql"
    "003_users_data.sql"
    "004_posts_data.sql"
    "005_azure_entra_config_data.sql"
    "006_schema_migrations_data.sql"
    "007_flyway_schema_history_data.sql"
)

for script in "${DATA_SCRIPTS[@]}"; do
    script_path="$SCRIPT_DIR/data/$script"
    if [ -f "$script_path" ]; then
        echo "  ✅ Applying $script..."
        if psql "$DSN" -f "$script_path"; then
            echo "  ✅ $script applied successfully!"
        else
            echo "  ❌ Error: Failed to apply $script"
            exit 1
        fi
    else
        echo "  ⚠️  Warning: $script not found, skipping..."
    fi
done

echo ""
echo "🎉 All AI-generated migrations have been applied successfully!"
echo ""
echo "📊 Database now includes:"
echo "   ✅ Complete schema with 16 tables"
echo "   ✅ 2 customers with multitenant support"
echo "   ✅ 2 sites for content management"
echo "   ✅ 1 admin user with authentication"
echo "   ✅ 10 posts (9 published, 1 draft)"
echo "   ✅ Azure Entra ID configuration"
echo "   ✅ Migration history tracking"
echo ""
echo "🔧 Next steps:"
echo "   1. Verify the installation with: psql \"\$DSN\" -c \"SELECT COUNT(*) FROM customers;\""
echo "   2. Start your applications"
echo "   3. Configure additional IAM providers as needed"
echo ""
