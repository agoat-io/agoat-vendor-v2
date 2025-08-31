# ADR 00001: Multitenancy Database Design for CockroachDB

## Status
Accepted

## Context
The AGoat Publisher platform needs to support a multitenant architecture where multiple customers can manage multiple sites with custom domain mapping. The database design must be optimized for CockroachDB's distributed architecture while avoiding hotspots and ensuring good performance and scalability.

## Decision
We will implement a **hybrid approach** combining:
1. **UUID-based primary keys** for better distribution
2. **Tenant-aware indexing** for efficient queries
3. **Logical partitioning** through tenant context
4. **Optimized key design** to avoid hotspots

## Rationale

### Why UUIDs Instead of Auto-Incrementing IDs?
- **Distribution**: UUIDs distribute writes evenly across all nodes in CockroachDB
- **No Hotspots**: Avoids the hotspot problem that occurs with auto-incrementing IDs
- **Global Uniqueness**: Ensures uniqueness across distributed nodes
- **Performance**: UUIDs perform well in CockroachDB's distributed environment

### Why Not Pure Tenant-Based Partitioning?
- **Flexibility**: Allows for cross-tenant operations when needed (admin functions)
- **Simplicity**: Easier to manage than complex partitioning schemes
- **CockroachDB Optimization**: CockroachDB handles distribution automatically with proper key design

### Key Design Principles

#### 1. Primary Key Strategy
```sql
-- Use UUIDs for all primary keys
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**Benefits:**
- Even distribution across all nodes
- No hotspots during high-write scenarios
- Global uniqueness guaranteed

#### 2. Tenant Context in Foreign Keys
```sql
-- Always include tenant context in relationships
customer_id UUID REFERENCES customers(id)
site_id UUID REFERENCES sites(id)
```

**Benefits:**
- Enables efficient tenant-scoped queries
- Maintains referential integrity
- Supports tenant isolation

#### 3. Composite Indexes for Tenant Queries
```sql
-- Optimize for tenant-scoped queries with partial indexes
CREATE INDEX idx_posts_site_id_status ON posts (site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_customer_id_role ON users (customer_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_site_id_published_at ON posts (site_id, published_at DESC) 
    WHERE status = 'published' AND deleted_at IS NULL;
```

**Benefits:**
- Efficient tenant-scoped queries
- Partial indexes reduce storage and maintenance overhead
- Optimized for common access patterns (active records)
- Better performance for time-ordered queries

#### 4. Time-Based Indexes for Analytics
```sql
-- Support time-based queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX idx_tenant_usage_period ON tenant_usage (period_start, period_end);
```

**Benefits:**
- Efficient time-range queries
- Good performance for analytics
- Supports reporting and monitoring

## Consequences

### Positive Consequences

#### Performance
- **Even Distribution**: UUIDs ensure writes are distributed evenly across all nodes
- **No Hotspots**: Eliminates the hotspot problem common with auto-incrementing IDs
- **Efficient Queries**: Tenant-scoped indexes provide fast query performance
- **Scalability**: Design scales horizontally with CockroachDB's distributed architecture

#### Maintainability
- **Simple Schema**: Straightforward design that's easy to understand and maintain
- **Flexible**: Supports both tenant-isolated and cross-tenant operations
- **Standard Patterns**: Uses well-established database patterns

#### Security
- **Tenant Isolation**: Clear tenant boundaries in the schema
- **Audit Trail**: Comprehensive audit logging with tenant context
- **Access Control**: Schema supports tenant-aware access control

### Negative Consequences

#### Storage Overhead
- **UUID Size**: UUIDs are larger than integers (16 bytes vs 8 bytes)
- **Index Size**: Larger indexes due to UUID storage
- **Network Overhead**: Slightly more data transferred

#### Query Complexity
- **Tenant Context**: All queries must include tenant context
- **Index Management**: More indexes to maintain
- **Migration Complexity**: More complex migration process

#### Development Overhead
- **Tenant Awareness**: Application code must be tenant-aware
- **Testing Complexity**: More complex testing scenarios
- **Debugging**: Harder to debug with UUIDs

## Implementation Details

### Table Design Strategy

#### 1. Customers Table
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Other fields...
);
```
- **Purpose**: Root tenant entity
- **Distribution**: UUID ensures even distribution
- **Isolation**: Complete isolation between customers

#### 2. Sites Table
```sql
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    -- Other fields...
);
```
- **Purpose**: Customer's sites
- **Distribution**: UUID + customer_id for good distribution
- **Isolation**: Sites are isolated per customer

#### 3. Domains Table
```sql
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id),
    hostname VARCHAR(255) UNIQUE NOT NULL,
    -- Other fields...
);
```
- **Purpose**: Domain mappings for sites
- **Distribution**: UUID ensures even distribution
- **Uniqueness**: Hostname must be globally unique

#### 4. Modified Existing Tables
```sql
-- Add tenant context to existing tables
ALTER TABLE users ADD COLUMN customer_id UUID REFERENCES customers(id);
ALTER TABLE users ADD COLUMN site_id UUID REFERENCES sites(id);
ALTER TABLE posts ADD COLUMN site_id UUID REFERENCES sites(id);

-- Add IAM integration fields
ALTER TABLE users ADD COLUMN external_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN iam_provider VARCHAR(50) DEFAULT 'default';
ALTER TABLE users ADD COLUMN iam_metadata JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN last_iam_sync TIMESTAMP;
ALTER TABLE users ADD COLUMN iam_sync_status VARCHAR(50) DEFAULT 'pending';
```

### Index Strategy

#### 1. Tenant-Scoped Composite Indexes
```sql
-- Optimize for tenant-scoped queries with partial indexes
CREATE INDEX idx_posts_site_id_status ON posts (site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_customer_id_role ON users (customer_id, role) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_site_id_published_at ON posts (site_id, published_at DESC) 
    WHERE status = 'published' AND deleted_at IS NULL;
```

#### 2. Analytics and Audit Indexes
```sql
-- Optimized for time-series queries with tenant context
CREATE INDEX idx_tenant_usage_customer_metric ON tenant_usage (customer_id, metric_name, recorded_at DESC);
CREATE INDEX idx_audit_logs_customer_created ON audit_logs (customer_id, created_at DESC) 
    WHERE customer_id IS NOT NULL;
```

#### 3. Unique Constraints and Functional Indexes
```sql
-- Ensure data integrity with tenant context
CREATE UNIQUE INDEX idx_domains_hostname ON domains (hostname);
CREATE UNIQUE INDEX idx_sites_customer_slug ON sites (customer_id, slug);
CREATE INDEX idx_posts_slug_site ON posts (slug, site_id) WHERE deleted_at IS NULL;

-- IAM integration indexes
CREATE INDEX idx_users_external_id ON users (external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_iam_user_mappings_external_id ON iam_user_mappings (external_user_id);
CREATE UNIQUE INDEX idx_iam_user_mappings_unique ON iam_user_mappings (customer_id, iam_provider_id, external_user_id);
```

### IAM Integration Strategy

#### 1. External IAM Support
- **Provider Configuration**: Support multiple IAM providers per customer (Auth0, Okta, Azure AD, etc.)
- **User Mapping**: Maintain mappings between external IAM users and internal users
- **Group Mapping**: Map external IAM groups to internal roles
- **Sync Management**: Track sync status and handle failures gracefully

#### 2. IAM Tables Design
```sql
-- Provider configuration per customer
CREATE TABLE iam_providers (
    customer_id UUID REFERENCES customers(id),
    provider_name VARCHAR(100), -- auth0, okta, azure_ad
    provider_type VARCHAR(50), -- oidc, oauth2, saml
    -- Configuration fields...
);

-- User mappings between external and internal
CREATE TABLE iam_user_mappings (
    customer_id UUID REFERENCES customers(id),
    user_id BIGINT REFERENCES users(id),
    external_user_id VARCHAR(255),
    -- Mapping fields...
);

-- Group to role mappings
CREATE TABLE iam_group_mappings (
    customer_id UUID REFERENCES customers(id),
    external_group_id VARCHAR(255),
    internal_role VARCHAR(50),
    -- Mapping fields...
);
```

#### 3. IAM Integration Benefits
- **Flexible Authentication**: Support any IAM provider
- **Role Mapping**: Automatic role assignment based on external groups
- **Sync Tracking**: Monitor sync status and handle failures
- **Tenant Isolation**: IAM configuration per customer

### Migration Strategy

#### 1. Backward Compatibility
- Create default customer and site using random UUIDs (avoid hotspots)
- Update existing records to belong to default tenant
- Maintain existing functionality during migration
- Use CTEs and temporary tables for efficient data migration

#### 2. Gradual Migration
- Add new columns without breaking existing functionality
- Migrate data in batches
- Validate data integrity after migration

#### 3. Rollback Plan
- Maintain backup of original schema
- Document rollback procedures
- Test rollback scenarios

## Performance Considerations

### Advanced Indexing Strategy
- **Partial Indexes**: Use WHERE clauses to index only active records
- **Composite Indexes**: Combine tenant context with query filters
- **Descending Order**: Use DESC for time-based columns in analytics
- **Conditional Indexes**: Index only relevant subsets of data

### Query Optimization
- **Tenant Scoping**: Always include tenant context in WHERE clauses
- **Index Usage**: Ensure queries use appropriate composite indexes
- **Connection Pooling**: Use tenant-aware connection pooling
- **Avoid Hotspots**: Use random UUIDs even for default data

### Monitoring
- **Query Performance**: Monitor query performance per tenant
- **Resource Usage**: Track resource usage per tenant
- **Hotspot Detection**: Monitor for potential hotspots

### Scaling
- **Horizontal Scaling**: Design supports horizontal scaling
- **Load Balancing**: Distribute load evenly across nodes
- **Capacity Planning**: Monitor capacity and plan for growth

## Security Considerations

### Data Isolation
- **Tenant Boundaries**: Clear tenant boundaries in schema
- **Access Control**: Tenant-aware access control
- **Audit Logging**: Comprehensive audit trail

### Encryption
- **Data at Rest**: Encrypt sensitive data
- **Data in Transit**: Use TLS for all connections
- **Key Management**: Secure key management

### IAM Security
- **Client Secret Encryption**: Encrypt IAM provider client secrets
- **External ID Validation**: Validate external user IDs to prevent impersonation
- **Sync Status Monitoring**: Monitor IAM sync failures for security issues
- **Audit Logging**: Log all IAM-related activities with tenant context

## Key Optimizations Implemented

### Hotspot Prevention
- **Random UUIDs for Default Data**: Avoid using fixed UUIDs that create hotspots
- **CTE-based Migration**: Use CTEs and temporary tables for efficient data migration
- **Distributed Writes**: Ensure all writes are distributed across nodes

### Index Optimization
- **Partial Indexes**: Index only active records (`WHERE deleted_at IS NULL`)
- **Composite Tenant Indexes**: Combine tenant_id with common filters
- **Time-Series Optimization**: Use DESC ordering for time-based queries
- **Conditional Indexing**: Index specific subsets (e.g., published posts only)

### Query Performance
- **Tenant-First Indexing**: Always lead with tenant context in composite indexes
- **Covering Indexes**: Include commonly selected columns in index
- **Analytics Optimization**: Specialized indexes for reporting queries

## Future Considerations

### Potential Improvements
- **Partitioning**: Consider table partitioning for very large tenants
- **Caching**: Implement tenant-aware caching
- **Archiving**: Implement data archiving strategies

### Monitoring and Alerting
- **Performance Monitoring**: Monitor query performance
- **Resource Monitoring**: Monitor resource usage
- **Alerting**: Set up alerts for performance issues

## References
- [CockroachDB Best Practices](https://www.cockroachlabs.com/docs/stable/best-practices.html)
- [CockroachDB Performance Tuning](https://www.cockroachlabs.com/docs/stable/performance-tuning.html)
- [UUID Performance in CockroachDB](https://www.cockroachlabs.com/docs/stable/uuid.html)
