# Database Migrations

This directory contains database migration scripts for the AGoat Publisher platform.

## Overview

Migrations are numbered sequentially and applied in order. Each migration should be:
- **Idempotent**: Safe to run multiple times
- **Backward Compatible**: Should not break existing functionality
- **Well Documented**: Clear description of changes and rationale

## Migration Files

### 00001_add_multitenancy.sql
**Date**: 2025-08-31  
**Description**: Add multitenancy support with customers, sites, and domain mapping

**Changes**:
- Add `customers` table for tenant management
- Add `sites` table for site management per customer
- Add `domains` table for domain mapping
- Add `tenant_usage` table for resource tracking
- Add `audit_logs` table for tenant activity logging
- Add `site_settings` table for site configuration
- Modify existing `users` and `posts` tables for tenant context
- Add comprehensive indexing for performance
- Add triggers for automatic timestamp updates

**Key Features**:
- UUID-based primary keys for even distribution
- Tenant-aware indexing for efficient queries
- Complete tenant isolation
- Resource usage tracking
- Comprehensive audit logging
- Site-specific configuration management

## Migration Process

### Prerequisites
- CockroachDB cluster running
- Database connection established
- Backup of existing data (recommended)

### Running Migrations

#### Manual Migration
```bash
# Connect to CockroachDB
cockroach sql --url="postgresql://username:password@host:port/database"

# Run migration
\i migrations/00001_add_multitenancy.sql
```

#### Automated Migration
```bash
# Using the migration script
./run-migration.sh 00001_add_multitenancy.sql
```

### Verification

#### Check Migration Status
```sql
-- Check if tables were created
SHOW TABLES;

-- Check if indexes were created
SHOW INDEXES FROM customers;
SHOW INDEXES FROM sites;
SHOW INDEXES FROM domains;
```

#### Verify Data Integrity
```sql
-- Check default customer was created
SELECT * FROM customers WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check default site was created
SELECT * FROM sites WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check existing data was migrated
SELECT COUNT(*) FROM users WHERE customer_id IS NOT NULL;
SELECT COUNT(*) FROM posts WHERE site_id IS NOT NULL;
```

## Rollback Procedures

### Rollback Migration 00001
```sql
-- Drop new tables
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS tenant_usage CASCADE;
DROP TABLE IF EXISTS domains CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Remove tenant columns from existing tables
ALTER TABLE posts DROP COLUMN IF EXISTS site_id;
ALTER TABLE posts DROP COLUMN IF EXISTS status;
ALTER TABLE posts DROP COLUMN IF EXISTS published_at;
ALTER TABLE posts DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE users DROP COLUMN IF EXISTS customer_id;
ALTER TABLE users DROP COLUMN IF EXISTS site_id;
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS status;
ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON site_settings;
DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
DROP TRIGGER IF EXISTS update_sites_updated_at ON sites;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## Performance Considerations

### Index Strategy
- **Tenant-Scoped Indexes**: Optimize for tenant-specific queries
- **Time-Based Indexes**: Support analytics and reporting
- **Unique Constraints**: Ensure data integrity

### Distribution Strategy
- **UUID Primary Keys**: Ensure even distribution across nodes
- **Composite Indexes**: Optimize for common query patterns
- **Avoid Hotspots**: Design prevents write hotspots

### Monitoring
- **Query Performance**: Monitor tenant-scoped query performance
- **Index Usage**: Track index usage and effectiveness
- **Resource Usage**: Monitor per-tenant resource consumption

## Security Considerations

### Data Isolation
- **Tenant Boundaries**: Clear tenant boundaries in schema
- **Access Control**: Tenant-aware access control
- **Audit Logging**: Comprehensive audit trail

### Data Protection
- **Encryption**: Data encrypted at rest and in transit
- **Access Logging**: All access logged with tenant context
- **Data Retention**: Tenant-specific data retention policies

## Best Practices

### Migration Development
1. **Test Locally**: Always test migrations on local development database
2. **Backup Data**: Create backup before running migrations
3. **Document Changes**: Clear documentation of all changes
4. **Version Control**: All migrations in version control
5. **Rollback Plan**: Always have a rollback plan

### Performance
1. **Index Strategy**: Design indexes for actual query patterns
2. **Distribution**: Ensure even distribution across nodes
3. **Monitoring**: Monitor performance after migration
4. **Optimization**: Optimize based on actual usage patterns

### Security
1. **Access Control**: Implement tenant-aware access control
2. **Audit Logging**: Log all tenant activities
3. **Data Protection**: Encrypt sensitive data
4. **Compliance**: Ensure compliance with data protection regulations

## Troubleshooting

### Common Issues

#### Migration Fails
- Check database connectivity
- Verify user permissions
- Check for conflicting objects
- Review error messages

#### Performance Issues
- Check index usage
- Monitor query performance
- Review distribution patterns
- Optimize based on usage

#### Data Integrity Issues
- Verify foreign key constraints
- Check unique constraints
- Validate tenant isolation
- Review audit logs

### Support
For migration issues, contact the database team or refer to the ADR documentation in the `docs/adrs/` directory.
