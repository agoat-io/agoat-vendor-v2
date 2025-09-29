# Complete Database Schema Setup

This directory contains the complete database schema for the AGoat Publisher platform, optimized for CockroachDB with multitenancy support and IAM integration.

## Files

- **`complete-schema.sql`** - Complete database schema for fresh database setup
- **`apply-complete-schema.sh`** - Script to apply the complete schema to a new database
- **`migrations/`** - Individual migration files for incremental updates
- **`tools/dbmigrate/`** - Database migration tool for managing schema changes

## Quick Start

### For New Database Setup

1. **Apply complete schema to fresh database:**
   ```bash
   ./app-api-database-schema/apply-complete-schema.sh
   ```

2. **Verify the setup:**
   ```bash
   ./tools/dbmigrate/start-migration.sh status
   ```

### For Existing Database Updates

1. **Use the migration tool:**
   ```bash
   ./tools/dbmigrate/start-migration.sh up
   ```

## Schema Overview

### Core Tables
- **`users`** - User accounts with tenant context and IAM integration
- **`posts`** - Content posts with tenant context
- **`customers`** - Customer accounts for multitenancy
- **`sites`** - Sites belonging to customers
- **`domains`** - Domain mappings for sites

### IAM Integration
- **`iam_providers`** - External IAM provider configurations
- **`iam_user_mappings`** - User mappings between internal and external IAM
- **`iam_group_mappings`** - Group-to-role mappings

### Monitoring & Analytics
- **`tenant_usage`** - Resource usage tracking per tenant
- **`audit_logs`** - Comprehensive audit logging
- **`site_settings`** - Site-specific configuration

## Key Features

### 🚀 CockroachDB Optimizations
- **UUID Primary Keys** - Using `gen_random_uuid()` for even data distribution
- **Partial Indexes** - Optimized for tenant-scoped queries
- **Composite Indexes** - Efficient multi-column filtering
- **Hotspot Prevention** - Strategic key design for scalability

### 🔐 Multitenancy
- **Complete Data Isolation** - Tenant-scoped data access
- **Customer Management** - Multi-customer support
- **Site Management** - Multi-site per customer
- **Domain Mapping** - Custom hostname support

### 🔑 IAM Integration
- **External Provider Support** - Auth0, Okta, Azure, Google
- **User Synchronization** - Automatic user mapping
- **Group-to-Role Mapping** - Role-based access control
- **Sync Status Tracking** - Monitor integration health

### 📊 Monitoring
- **Resource Usage Tracking** - Per-tenant metrics
- **Audit Logging** - Comprehensive activity tracking
- **Performance Indexes** - Optimized query performance

## Database Connection

The schema uses the same connection method as the API:
- **DSN**: Loaded from GCP Secrets Manager
- **CA Certificate**: For CockroachDB TLS verification
- **Connection Pooling**: Optimized for production workloads

## Migration Strategy

### Version 1: Complete Schema
- Initial schema with multitenancy support
- IAM integration framework
- Optimized indexes for CockroachDB
- Default customer and site setup

### Future Versions
- Additional features and optimizations
- Schema evolution tracking
- Backward compatibility maintenance

## Performance Considerations

### Index Strategy
- **13 Optimized Indexes** - Balanced performance and storage
- **Partial Indexes** - Reduced maintenance overhead
- **Composite Indexes** - Efficient multi-column queries
- **Tenant-Scoped** - Optimized for isolation patterns

### Storage Optimization
- **UUID Distribution** - Even data spread across nodes
- **JSONB Fields** - Flexible metadata storage
- **Soft Deletes** - Data preservation with `deleted_at`
- **Efficient Constraints** - Minimal overhead

## Security Features

### Data Isolation
- **Tenant Context** - All queries scoped by tenant
- **Foreign Key Constraints** - Referential integrity
- **Check Constraints** - Data validation
- **Audit Logging** - Complete activity tracking

### IAM Security
- **Encrypted Secrets** - Client secret encryption
- **External ID Validation** - Secure user mapping
- **Sync Status Monitoring** - Integration health
- **Role-Based Access** - Granular permissions

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify GCP authentication
   - Check DSN format and CA certificate
   - Ensure network connectivity

2. **Schema Application Failures**
   - Check for existing tables
   - Verify SQL syntax compatibility
   - Review error messages for specific issues

3. **Performance Issues**
   - Monitor index usage
   - Check query execution plans
   - Review tenant isolation patterns

### Support

For migration issues:
1. Check the migration tool status
2. Review the audit logs
3. Consult the ADR documentation in `docs/adrs/`
4. Contact the database team

## Next Steps

After applying the schema:

1. **Configure IAM Providers** - Set up external authentication
2. **Create Customer Accounts** - Onboard initial customers
3. **Configure Sites** - Set up customer sites
4. **Map Domains** - Configure custom hostnames
5. **Monitor Performance** - Track usage and optimize

---

**Note**: This schema is designed for production use with CockroachDB. For development or testing, consider using the migration tool for incremental updates.
