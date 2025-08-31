# Database Migration Tool

## Overview

A production-ready database migration tool specifically designed for the AGoat Publisher platform, optimized for CockroachDB with full multitenancy support and data preservation capabilities.

## 🎯 Key Features

### ✅ **Production-Ready Features**
- **Versioned Migrations**: Sequential migration files with automatic tracking
- **Transaction Safety**: All migrations run in transactions with automatic rollback
- **Migration History**: Complete audit trail with execution times and status
- **Rollback Support**: Full rollback capability with down migrations
- **Data Preservation**: Migrations preserve existing data while adding schema elements
- **Dry Run Mode**: Preview migrations without executing them

### ✅ **CockroachDB Optimizations**
- **UUID Primary Keys**: Uses `gen_random_uuid()` for optimal distribution
- **Hotspot Prevention**: Random UUIDs prevent write hotspots
- **TLS Support**: Built-in support for CockroachDB TLS certificates
- **Connection Pooling**: Optimized connection management
- **Distributed Queries**: Designed for CockroachDB's distributed architecture

### ✅ **Multitenancy Support**
- **Tenant Isolation**: Proper tenant context in all migrations
- **Customer/Site Management**: Built-in support for multitenant data structures
- **IAM Integration**: Support for external authentication providers
- **Resource Tracking**: Tenant-specific resource usage monitoring

## 📁 Project Structure

```
tools/dbmigrate/
├── main.go                    # Main entry point
├── go.mod                     # Go module dependencies
├── start-migration.sh         # Startup script with GCP secrets
├── README.md                  # Comprehensive documentation
├── internal/
│   ├── config/
│   │   └── config.go         # Configuration management
│   └── migrator/
│       └── migrator.go       # Core migration logic
└── migrations/               # Migration files
    └── 00001_add_multitenancy.sql
```

## 🚀 Quick Start

### 1. **Navigate to the migration tool directory:**
```bash
cd tools/dbmigrate
```

### 2. **Run the startup script:**
```bash
./start-migration.sh
```

### 3. **Check migration status:**
```bash
./start-migration.sh status
```

## 📖 Usage Examples

### Basic Commands
```bash
# Check current migration status
./start-migration.sh status

# Apply all pending migrations
./start-migration.sh up

# Apply migrations up to specific version
./start-migration.sh up -version 5

# Rollback migrations down to version
./start-migration.sh down -version 3

# Create new migration file
./start-migration.sh create add_users_table

# Validate migration files
./start-migration.sh validate

# Dry run (preview without executing)
./start-migration.sh up -dry-run
```

## 🗄️ Migration Tracking

The tool creates and maintains a `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
    version BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);
```

### Migration History Features
- **Version Tracking**: Sequential version numbers
- **Execution Times**: Performance monitoring
- **Status Tracking**: Success/failure status
- **Error Details**: Detailed error messages for failed migrations
- **Checksum Validation**: Content integrity verification

## 🔧 Configuration

### Environment Variables
- `DSN`: Database connection string
- `CA`: Database CA certificate (for CockroachDB)
- `DB_DRIVER`: Database driver (default: postgres)
- `DB_MAX_CONNS`: Maximum connections (default: 10)
- `DB_TIMEOUT`: Connection timeout in seconds (default: 30)

### GCP Secrets Integration
The startup script automatically loads secrets from Google Cloud:
- `agoat-publisher-db-main-cockroach-ca`: CA certificate
- `agoat-publisher-db-main-cockroach-dsn`: Connection string

## 📝 Migration File Format

### File Naming Convention
```
00001_add_multitenancy.sql
00002_add_user_roles.sql
00003_add_audit_logging.sql
```

### Migration Content Structure
```sql
-- Migration: 00001_add_multitenancy.sql
-- Description: Add multitenancy support
-- Date: 2025-01-15
-- Author: AGoat Publisher Team

-- UP MIGRATION
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- DOWN MIGRATION
DROP TABLE IF EXISTS customers;
```

## 🛡️ Safety Features

### Transaction Safety
- All migrations run in database transactions
- Automatic rollback on any error
- Failed migrations are recorded with error details

### Validation
- Migration file format validation
- SQL syntax checking (basic)
- Checksum verification for applied migrations

### Backup Recommendations
```bash
# Create backup before major migrations
cockroach dump --host=localhost:26257 --database=agoat_publisher > backup.sql

# Run migration
./start-migration.sh up

# Verify and restore if needed
cockroach sql --host=localhost:26257 --database=agoat_publisher < backup.sql
```

## 📊 Best Practices

### Migration Design
1. **Keep migrations small**: One logical change per migration
2. **Use descriptive names**: Clear, specific migration names
3. **Include rollback logic**: Always provide down migrations
4. **Test thoroughly**: Test both up and down migrations
5. **Use transactions**: Let the tool handle transaction management

### CockroachDB Specific
1. **Use UUIDs**: Always use `gen_random_uuid()` for primary keys
2. **Avoid hotspots**: Use random distribution for high-write tables
3. **Optimize indexes**: Use partial indexes for large tables
4. **Consider distribution**: Design for CockroachDB's distributed nature

### Production Deployment
1. **Backup first**: Always backup before major migrations
2. **Test in staging**: Test migrations in staging environment
3. **Monitor performance**: Watch for migration impact on performance
4. **Rollback plan**: Have a rollback strategy ready
5. **Documentation**: Document complex migrations

## 🔍 Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check if database is accessible
cockroach sql --host=localhost:26257 --database=agoat_publisher

# Verify secrets are loaded
echo $DSN
echo $CA
```

#### Migration Failures
```bash
# Check migration status
./start-migration.sh status

# View failed migrations
cockroach sql -e "SELECT * FROM schema_migrations WHERE status = 'failed';"
```

### Debug Mode
```bash
# Enable verbose logging
./start-migration.sh status -verbose

# Dry run with verbose output
./start-migration.sh up -dry-run -verbose
```

## 🔗 Integration

### CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
- name: Run Database Migrations
  run: |
    cd tools/dbmigrate
    ./start-migration.sh up
  env:
    DSN: ${{ secrets.DATABASE_DSN }}
    CA: ${{ secrets.DATABASE_CA }}
```

### Application Integration
```go
// Check migration status in application startup
func ensureMigrations() error {
    cmd := exec.Command("./dbmigrate", "status")
    return cmd.Run()
}
```

## 📚 Example Migration

The tool includes a comprehensive example migration (`00001_add_multitenancy.sql`) that demonstrates:

- **UUID Primary Keys**: Using `gen_random_uuid()` for optimal distribution
- **Tenant Isolation**: Complete multitenancy support
- **Data Preservation**: Migrating existing data to new schema
- **IAM Integration**: External authentication provider support
- **Index Optimization**: Performance-optimized indexes
- **Rollback Support**: Complete down migration

## 🎯 Benefits

### For Developers
- **Simple Commands**: Easy-to-use CLI interface
- **Automatic Tracking**: No manual migration state management
- **Rollback Safety**: Safe rollback capabilities
- **Data Preservation**: Existing data is preserved during migrations

### For Operations
- **Production Ready**: Transaction safety and error handling
- **Audit Trail**: Complete migration history
- **Performance Monitoring**: Execution time tracking
- **Backup Integration**: Works with existing backup strategies

### For CockroachDB
- **Optimized Design**: Specifically designed for distributed databases
- **Hotspot Prevention**: UUID-based primary keys
- **TLS Support**: Built-in security features
- **Scalability**: Designed for horizontal scaling

## 🚀 Next Steps

1. **Test the tool** with the example migration
2. **Create new migrations** for your specific needs
3. **Integrate into CI/CD** for automated deployments
4. **Monitor performance** and optimize as needed
5. **Document complex migrations** for team knowledge

The migration tool is now ready for production use and provides a robust foundation for managing database schema changes in the AGoat Publisher platform.
