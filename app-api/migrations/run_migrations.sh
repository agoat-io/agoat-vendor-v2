#!/bin/bash

# Migration Runner Script for AGoat Publisher
# This script runs database migrations in order
# Date: 2024-09-28

set -e

# Configuration
MIGRATIONS_DIR="$(dirname "$0")"
DATABASE_URL="${DATABASE_URL:-$DSN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if database URL is provided
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL or DSN environment variable is required"
    log_info "Usage: DATABASE_URL='postgres://user:pass@host:port/db' $0"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    log_error "psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Function to run a migration
run_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file" .sql)
    
    log_info "Running migration: $migration_name"
    
    # Check if migration has already been applied
    local version=$(echo "$migration_name" | grep -o '^[0-9]*')
    if [ -z "$version" ]; then
        log_error "Migration file $migration_file does not have a version number prefix"
        return 1
    fi
    
    # Check if this migration has already been applied
    local applied=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE version = $version;" 2>/dev/null | xargs)
    
    if [ "$applied" = "1" ]; then
        log_warning "Migration $migration_name (version $version) has already been applied, skipping"
        return 0
    fi
    
    # Run the migration
    local start_time=$(date +%s)
    
    if psql "$DATABASE_URL" -f "$migration_file" -v ON_ERROR_STOP=1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log_success "Migration $migration_name completed successfully in ${duration}s"
        return 0
    else
        log_error "Migration $migration_name failed"
        return 1
    fi
}

# Function to list available migrations
list_migrations() {
    log_info "Available migrations:"
    for migration in "$MIGRATIONS_DIR"/*.sql; do
        if [ -f "$migration" ]; then
            local migration_name=$(basename "$migration" .sql)
            local version=$(echo "$migration_name" | grep -o '^[0-9]*')
            if [ -n "$version" ]; then
                echo "  $migration_name"
            fi
        fi
    done
}

# Function to show migration status
show_status() {
    log_info "Migration status:"
    psql "$DATABASE_URL" -c "SELECT version, name, applied_at, status FROM schema_migrations ORDER BY version;"
}

# Function to rollback a migration (basic implementation)
rollback_migration() {
    local version="$1"
    
    if [ -z "$version" ]; then
        log_error "Version number is required for rollback"
        return 1
    fi
    
    log_warning "Rollback functionality is not implemented yet"
    log_info "To rollback, you would need to manually reverse the changes from migration version $version"
    return 1
}

# Main function
main() {
    local command="${1:-run}"
    
    case "$command" in
        "run")
            log_info "Starting database migrations..."
            
            # Get list of migration files and sort them by version number
            local migrations=($(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | grep -E '[0-9]+_.*\.sql$' | sort -V))
            
            if [ ${#migrations[@]} -eq 0 ]; then
                log_warning "No migration files found in $MIGRATIONS_DIR"
                return 0
            fi
            
            # Run each migration
            for migration in "${migrations[@]}"; do
                if ! run_migration "$migration"; then
                    log_error "Migration process stopped due to error"
                    exit 1
                fi
            done
            
            log_success "All migrations completed successfully"
            ;;
            
        "list")
            list_migrations
            ;;
            
        "status")
            show_status
            ;;
            
        "rollback")
            rollback_migration "$2"
            ;;
            
        "help"|"-h"|"--help")
            echo "AGoat Publisher Database Migration Runner"
            echo ""
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  run      Run all pending migrations (default)"
            echo "  list     List available migrations"
            echo "  status   Show migration status"
            echo "  rollback <version>  Rollback a specific migration (not implemented)"
            echo "  help     Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  DATABASE_URL  PostgreSQL connection string"
            echo "  DSN          Alternative to DATABASE_URL"
            echo ""
            echo "Examples:"
            echo "  DATABASE_URL='postgres://user:pass@localhost:5432/agoat' $0"
            echo "  $0 list"
            echo "  $0 status"
            ;;
            
        *)
            log_error "Unknown command: $command"
            log_info "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
