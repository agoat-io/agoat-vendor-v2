# Database Migration Tool

A robust, production-ready database migration tool for the AGoat Publisher platform, designed specifically for CockroachDB with support for multitenancy and data preservation.

## 🚀 Features

### Core Functionality
- **Versioned Migrations**: Sequential migration files with automatic version tracking
- **Transaction Safety**: All migrations run in transactions with automatic rollback on failure
- **Migration History**: Complete audit trail of applied migrations with execution times
- **Rollback Support**: Full rollback capability with down migrations
- **Data Preservation**: Migrations preserve existing data while adding new schema elements
- **Dry Run Mode**: Preview migrations without executing them

### CockroachDB Optimizations
- **UUID Primary Keys**: Uses `gen_random_uuid()` for optimal distribution
- **Hotspot Prevention**: Random UUIDs prevent write hotspots
- **TLS Support**: Built-in support for CockroachDB TLS certificates
- **Connection Pooling**: Optimized connection management
- **Distributed Queries**: Designed for CockroachDB's distributed architecture

### Multitenancy Support
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
├── README.md                  # This documentation
├── internal/
│   ├── config/
│   │   └── config.go         # Configuration management
│   └── migrator/
│       └── migrator.go       # Core migration logic
└── migrations/               # Migration files (created automatically)
    ├── 00001_add_multitenancy.sql
    └── ...
```

## 🛠️ Installation & Setup

### Prerequisites
- Go 1.21 or later
- Google Cloud SDK (for secrets management)
- CockroachDB access

### Quick Start

1. **Navigate to the migration tool directory:**
   ```bash
   cd tools/dbmigrate
   ```

2. **Run the startup script:**
   ```bash
   ./start-migration.sh
   ```

3. **Check migration status:**
   ```bash
   ./start-migration.sh status
   ```

## 📖 Usage

### Basic Commands

#### Check Migration Status
```bash
./start-migration.sh status
```
Shows current migration status, applied migrations, and pending migrations.

#### Apply All Pending Migrations
```bash
./start-migration.sh up
```
Applies all pending migrations in order.

#### Apply Migrations Up to Specific Version
```bash
./start-migration.sh up -version 5
```
Applies migrations up to and including version 5.

#### Rollback Migrations
```bash
./start-migration.sh down -version 3
```
Rolls back migrations down to version 3.

#### Create New Migration
```bash
./start-migration.sh create add_users_table
```
Creates a new migration file with the specified name.

#### Validate Migrations
```bash
./start-migration.sh validate
```
Validates migration files without executing them.

#### Dry Run
```bash
./start-migration.sh up -dry-run
```
Shows what would be executed without making changes.

### Advanced Usage

#### Direct Tool Usage
```bash
# Build the tool
go build -o dbmigrate main.go

# Run with environment variables
export DSN="your-connection-string"
export CA="your-ca-certificate"
./dbmigrate status
```

#### Configuration File
Create a `config.yaml` file:
```yaml
database:
  driver: "postgres"
  dsn: "postgresql://user:pass@host:port/db"
  ca: "your-ca-certificate"
  max_conns: 10
  timeout: 30

logging:
  level: "info"
  format: "text"
```

Run with config:
```bash
./dbmigrate -config config.yaml status
```

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

### Migration Separators
The tool recognizes these separators for up/down migrations:
- `-- DOWN`
- `-- DOWN MIGRATION`
- `-- ROLLBACK`
- `--- DOWN`
- `--- ROLLBACK`

## 🗄️ Migration Tracking Table

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

### Fields Explained
- **version**: Migration version number
- **name**: Migration name/description
- **applied_at**: When the migration was applied
- **checksum**: Content hash for validation
- **execution_time_ms**: How long the migration took
- **status**: 'success' or 'failed'
- **error_message**: Error details if failed

## 🔧 Configuration

### Environment Variables
- `DSN`: Database connection string
- `CA`: Database CA certificate (for CockroachDB)
- `DB_DRIVER`: Database driver (default: postgres)
- `DB_MAX_CONNS`: Maximum connections (default: 10)
- `DB_TIMEOUT`: Connection timeout in seconds (default: 30)
- `LOG_LEVEL`: Logging level (default: info)
- `LOG_FORMAT`: Log format (default: text)

### GCP Secrets Integration
The startup script automatically loads secrets from Google Cloud:
- `agoat-publisher-db-main-cockroach-ca`: CA certificate
- `agoat-publisher-db-main-cockroach-dsn`: Connection string

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

#### Permission Issues
```bash
# Ensure migration tool has proper permissions
chmod +x start-migration.sh
chmod +x dbmigrate
```

### Debug Mode
```bash
# Enable verbose logging
./start-migration.sh status -verbose

# Dry run with verbose output
./start-migration.sh up -dry-run -verbose
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

## 📚 Examples

### Simple Table Creation
```sql
-- 00001_create_users.sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- DOWN
DROP TABLE IF EXISTS users;
```

### Complex Multitenant Migration
```sql
-- 00002_add_multitenancy.sql
-- Add tenant context to existing tables
ALTER TABLE users ADD COLUMN customer_id UUID;
ALTER TABLE posts ADD COLUMN site_id UUID;

-- Create tenant tables
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL
);

-- Add foreign keys
ALTER TABLE users ADD CONSTRAINT fk_users_customer 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

-- DOWN
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_customer;
ALTER TABLE users DROP COLUMN IF EXISTS customer_id;
ALTER TABLE posts DROP COLUMN IF EXISTS site_id;
DROP TABLE IF EXISTS customers;
```

## 🤝 Contributing

### Adding New Features
1. Follow Go best practices
2. Add comprehensive tests
3. Update documentation
4. Maintain backward compatibility

### Reporting Issues
1. Check existing issues
2. Provide detailed error messages
3. Include migration files if relevant
4. Specify CockroachDB version

## 📄 License

This tool is part of the AGoat Publisher platform and follows the same licensing terms.
