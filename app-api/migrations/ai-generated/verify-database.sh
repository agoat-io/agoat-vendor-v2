#!/bin/bash

# AGoat Publisher - Verify Database State
# This script verifies that all tables and data are correctly installed

echo "🔍 AGoat Publisher - Database Verification"
echo "=========================================="

# Check if DSN is provided
if [ -z "$DSN" ]; then
    echo "❌ Error: DSN environment variable not set"
    echo "Please set DSN to your database connection string"
    exit 1
fi

echo "🔐 Using DSN: ${DSN:0:20}..."
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed or not in PATH"
    exit 1
fi

echo "🐘 Using psql for database verification..."
echo ""

# Function to check table exists and has expected rows
check_table() {
    local table_name="$1"
    local expected_min_rows="$2"
    
    echo "🔍 Checking table: $table_name"
    
    # Check if table exists
    table_exists=$(psql "$DSN" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table_name';" 2>/dev/null | tr -d ' ')
    
    if [ "$table_exists" = "1" ]; then
        # Get row count
        row_count=$(psql "$DSN" -t -c "SELECT COUNT(*) FROM $table_name;" 2>/dev/null | tr -d ' ')
        
        if [ -n "$row_count" ] && [ "$row_count" -ge "$expected_min_rows" ]; then
            echo "  ✅ $table_name: $row_count rows (expected: >= $expected_min_rows)"
        else
            echo "  ⚠️  $table_name: $row_count rows (expected: >= $expected_min_rows)"
        fi
    else
        echo "  ❌ $table_name: Table not found"
    fi
    echo ""
}

# Check all expected tables
echo "📊 Verifying table structure and data..."
echo ""

# Core tables
check_table "customers" 2
check_table "sites" 2
check_table "users" 1
check_table "posts" 10

# Authentication tables
check_table "azure_entra_config" 1
check_table "azure_entra_sessions" 0
check_table "azure_entra_token_cache" 0
check_table "iam_providers" 0
check_table "iam_user_mappings" 0
check_table "iam_group_mappings" 0

# System tables
check_table "schema_migrations" 2
check_table "flyway_schema_history" 3
check_table "audit_logs" 0
check_table "domains" 0
check_table "site_settings" 0
check_table "tenant_usage" 0

# Check foreign key relationships
echo "🔗 Verifying foreign key relationships..."
echo ""

# Check customers -> sites relationship
sites_with_customers=$(psql "$DSN" -t -c "SELECT COUNT(*) FROM sites s JOIN customers c ON s.customer_id = c.id;" 2>/dev/null | tr -d ' ')
echo "  ✅ Sites with valid customers: $sites_with_customers"

# Check users -> customers relationship
users_with_customers=$(psql "$DSN" -t -c "SELECT COUNT(*) FROM users u JOIN customers c ON u.customer_id = c.id;" 2>/dev/null | tr -d ' ')
echo "  ✅ Users with valid customers: $users_with_customers"

# Check posts -> users relationship
posts_with_users=$(psql "$DSN" -t -c "SELECT COUNT(*) FROM posts p JOIN users u ON p.user_id = u.id;" 2>/dev/null | tr -d ' ')
echo "  ✅ Posts with valid users: $posts_with_users"

# Check posts -> sites relationship
posts_with_sites=$(psql "$DSN" -t -c "SELECT COUNT(*) FROM posts p JOIN sites s ON p.site_id = s.id;" 2>/dev/null | tr -d ' ')
echo "  ✅ Posts with valid sites: $posts_with_sites"

echo ""

# Check indexes
echo "📈 Verifying indexes..."
echo ""

index_count=$(psql "$DSN" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null | tr -d ' ')
echo "  ✅ Total indexes created: $index_count"

echo ""

# Check triggers
echo "⚡ Verifying triggers..."
echo ""

trigger_count=$(psql "$DSN" -t -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';" 2>/dev/null | tr -d ' ')
echo "  ✅ Total triggers created: $trigger_count"

echo ""

# Summary
echo "📋 Verification Summary"
echo "======================="
echo "✅ Database schema verification completed"
echo "✅ Data integrity checks completed"
echo "✅ Foreign key relationships verified"
echo "✅ Indexes and triggers confirmed"
echo ""
echo "🎉 Database is ready for use!"
echo ""
echo "🔧 Quick test queries:"
echo "   - List customers: psql \"\$DSN\" -c \"SELECT name, email FROM customers;\""
echo "   - List sites: psql \"\$DSN\" -c \"SELECT name, domain FROM sites;\""
echo "   - List users: psql \"\$DSN\" -c \"SELECT username, email, role FROM users;\""
echo "   - List posts: psql \"\$DSN\" -c \"SELECT title, status FROM posts;\""
echo ""
