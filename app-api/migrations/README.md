# Database Migrations - AGoat Publisher

## Overview
This directory contains database migration scripts for the AGoat Publisher system. The migrations are designed to be run in order and are based on the reverse engineering of the current application code.

## Migration Files

### 001_initial_schema.sql
**Description**: Creates the initial database schema for AGoat Publisher  
**Date**: 2024-09-28  
**Status**: ✅ Ready

**Tables Created**:
- `customers` - Customer accounts for multitenant architecture
- `sites` - Sites belonging to customers
- `users` - User accounts with Azure Entra ID integration
- `posts` - Content posts with tenant context
- `azure_entra_config` - Azure Entra ID configuration settings
- `schema_migrations` - Migration tracking table

**Key Features**:
- Multitenant architecture with customer/site hierarchy
- Azure Entra ID integration fields
- Comprehensive indexing for performance
- Automatic timestamp triggers
- Default customer and site creation

### 002_cognito_ciam_support.sql
**Description**: Adds AWS Cognito and Multi-CIAM support  
**Date**: 2024-09-28  
**Status**: ✅ Ready

**Tables Created**:
- `ciam_systems` - Configuration for different CIAM systems
- `user_ciam_mappings` - Mappings between app users and CIAM identities

**Fields Added**:
- Cognito-specific fields to `users` table
- CIAM mapping support for multiple authentication providers

**Key Features**:
- Multi-CIAM system support (Cognito, Azure Entra ID, Auth0, etc.)
- Single current CIAM per user with historical tracking
- Cognito integration with JWKS validation
- Automatic migration of existing Azure users to CIAM mappings

## Running Migrations

### Prerequisites
- PostgreSQL client tools (`psql`)
- Database connection string in `DATABASE_URL` or `DSN` environment variable

### Basic Usage
```bash
# Run all pending migrations
./run_migrations.sh

# List available migrations
./run_migrations.sh list

# Show migration status
./run_migrations.sh status

# Show help
./run_migrations.sh help
```

### Environment Variables
```bash
# Required: Database connection string
export DATABASE_URL="postgres://user:password@host:port/database"

# Alternative: Use DSN (if DATABASE_URL is not set)
export DSN="postgres://user:password@host:port/database"
```

### Examples
```bash
# Run migrations with explicit database URL
DATABASE_URL="postgres://agoat:password@localhost:5432/agoat_publisher" ./run_migrations.sh

# Check migration status
./run_migrations.sh status

# List all available migrations
./run_migrations.sh list
```

## Database Schema Overview

### Core Tables

#### customers
- **Purpose**: Customer accounts for multitenant architecture
- **Key Fields**: `id`, `name`, `email`, `status`, `subscription_plan`
- **Relationships**: One-to-many with `sites`

#### sites
- **Purpose**: Sites belonging to customers
- **Key Fields**: `id`, `customer_id`, `name`, `slug`, `status`, `template`
- **Relationships**: Belongs to `customers`, one-to-many with `posts`

#### users
- **Purpose**: User accounts with multi-CIAM support
- **Key Fields**: `id`, `email`, `username`, `auth_method`
- **CIAM Fields**: Azure Entra ID fields, Cognito fields
- **Relationships**: One-to-many with `posts`, one-to-many with `user_ciam_mappings`

#### posts
- **Purpose**: Content posts with tenant context
- **Key Fields**: `id`, `user_id`, `site_id`, `title`, `content`, `slug`, `status`
- **Relationships**: Belongs to `users` and `sites`

### CIAM Tables

#### ciam_systems
- **Purpose**: Configuration for different CIAM systems
- **Key Fields**: `system_name`, `display_name`, `jwks_url`, `issuer_url`, `configuration`
- **Supported Systems**: Cognito, Azure Entra ID, Auth0, etc.

#### user_ciam_mappings
- **Purpose**: Mappings between app users and CIAM identities
- **Key Fields**: `app_user_id`, `ciam_identifier`, `ciam_system`, `is_current_ciam`
- **Features**: Multiple CIAM systems per user, single current active mapping

## Indexing Strategy

### Performance Indexes
- **Customer queries**: `idx_customers_status`, `idx_customers_email`
- **Site queries**: `idx_sites_customer_id`, `idx_sites_slug`
- **User queries**: `idx_users_email`, `idx_users_azure_entra_id`
- **Post queries**: `idx_posts_site_id`, `idx_posts_published`
- **CIAM queries**: `idx_user_ciam_mappings_current`

### Partial Indexes
- Most indexes include `WHERE deleted_at IS NULL` for soft-deleted records
- Status indexes focus on active records only
- Published post indexes focus on published content only

## Migration Safety

### Idempotent Operations
- All migrations use `CREATE TABLE IF NOT EXISTS`
- All indexes use `CREATE INDEX IF NOT EXISTS`
- All triggers use `CREATE TRIGGER IF NOT EXISTS`
- Data inserts use `ON CONFLICT DO NOTHING` or `ON CONFLICT DO UPDATE`

### Rollback Considerations
- Migrations are designed to be additive
- No destructive operations in initial migrations
- Rollback functionality not implemented (requires manual intervention)

### Version Tracking
- All migrations are tracked in `schema_migrations` table
- Includes version, name, checksum, execution time, and status
- Prevents duplicate execution of migrations

## Development Workflow

### Adding New Migrations
1. Create new migration file with format: `XXX_description.sql`
2. Use sequential version numbers (003, 004, etc.)
3. Include proper error handling and idempotent operations
4. Add comments and documentation
5. Test migration on development database
6. Update this README with migration details

### Testing Migrations
```bash
# Test on development database
DATABASE_URL="postgres://dev_user:dev_pass@localhost:5432/agoat_dev" ./run_migrations.sh

# Verify schema
psql "$DATABASE_URL" -c "\dt"  # List tables
psql "$DATABASE_URL" -c "\di"  # List indexes
```

### Production Deployment
1. Backup production database
2. Test migrations on staging environment
3. Run migrations during maintenance window
4. Verify application functionality
5. Monitor performance after migration

## Troubleshooting

### Common Issues

#### Migration Already Applied
```
[WARNING] Migration 001_initial_schema (version 1) has already been applied, skipping
```
**Solution**: This is normal behavior. The migration system prevents duplicate execution.

#### Database Connection Error
```
[ERROR] DATABASE_URL or DSN environment variable is required
```
**Solution**: Set the `DATABASE_URL` environment variable with your database connection string.

#### Permission Denied
```
[ERROR] permission denied for table users
```
**Solution**: Ensure the database user has sufficient privileges to create tables and indexes.

### Recovery Procedures

#### Failed Migration
1. Check the error message in the migration output
2. Fix the issue in the migration file
3. Manually update `schema_migrations` table if needed
4. Re-run the migration

#### Schema Inconsistency
1. Compare current schema with expected schema
2. Identify missing tables, columns, or indexes
3. Create additional migration to fix inconsistencies
4. Test thoroughly before applying to production

## Security Considerations

### Database Access
- Use dedicated database user with minimal required privileges
- Rotate database passwords regularly
- Use SSL connections in production
- Restrict network access to database servers

### Migration Security
- Store migration files in version control
- Use checksums to verify migration integrity
- Audit migration execution logs
- Implement proper access controls for migration execution

## Monitoring and Maintenance

### Performance Monitoring
- Monitor query performance after migrations
- Check index usage statistics
- Analyze slow query logs
- Optimize indexes based on actual usage patterns

### Regular Maintenance
- Review and clean up old migration files
- Update documentation as schema evolves
- Monitor database growth and performance
- Plan for future schema changes

---

## Support

For issues with database migrations:
1. Check the troubleshooting section above
2. Review migration logs and error messages
3. Consult the application documentation
4. Contact the development team for assistance
