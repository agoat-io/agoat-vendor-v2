# Database Schema Analysis - AGoat Publisher

## Overview
This document provides a comprehensive analysis of the AGoat Publisher database schema based on reverse engineering of the current application code and alignment with the global instructions.

## Analysis Methodology
1. **Code Analysis**: Examined `main.go`, handlers, and services to identify table structures
2. **Query Analysis**: Analyzed SQL queries to understand relationships and constraints
3. **Migration Creation**: Created proper migration scripts based on current implementation
4. **Schema Validation**: Ensured migrations align with actual database usage

## Current Database Schema

### Core Tables

#### 1. customers
**Purpose**: Customer accounts for multitenant architecture  
**Source**: Referenced in `sites` table and application logic

```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    subscription_plan VARCHAR(100) NOT NULL DEFAULT 'basic',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    max_sites INTEGER NOT NULL DEFAULT 1,
    max_storage_gb INTEGER NOT NULL DEFAULT 10,
    max_bandwidth_gb INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Key Relationships**:
- One-to-many with `sites`
- Referenced by `sites.customer_id`

#### 2. sites
**Purpose**: Sites belonging to customers  
**Source**: Direct usage in `main.go` SQL queries

```sql
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    template VARCHAR(100) DEFAULT 'default',
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(customer_id, slug)
);
```

**Key Relationships**:
- Belongs to `customers` via `customer_id`
- One-to-many with `posts` via `site_id`

#### 3. users
**Purpose**: User accounts with multi-CIAM support  
**Source**: Azure auth handlers and application logic

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    
    -- Azure Entra ID fields
    azure_entra_id VARCHAR(255),
    azure_tenant_id VARCHAR(255),
    azure_object_id VARCHAR(255),
    azure_principal_name VARCHAR(255),
    azure_display_name VARCHAR(255),
    azure_given_name VARCHAR(255),
    azure_family_name VARCHAR(255),
    azure_preferred_username VARCHAR(255),
    
    -- Cognito fields
    cognito_sub VARCHAR(255),
    cognito_user_pool_id VARCHAR(100),
    phone_number VARCHAR(50),
    phone_number_verified BOOLEAN DEFAULT FALSE,
    given_name VARCHAR(255),
    family_name VARCHAR(255),
    name VARCHAR(255),
    preferred_username VARCHAR(255),
    
    -- Authentication and status
    auth_method VARCHAR(50) DEFAULT 'default',
    email_verified BOOLEAN DEFAULT false,
    account_enabled BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata timestamps
    created_by_azure BOOLEAN DEFAULT false,
    azure_created_at TIMESTAMP WITH TIME ZONE,
    azure_updated_at TIMESTAMP WITH TIME ZONE,
    cognito_created_at TIMESTAMP WITH TIME ZONE,
    cognito_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Standard timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Key Relationships**:
- One-to-many with `posts` via `user_id`
- One-to-many with `user_ciam_mappings` via `app_user_id`

#### 4. posts
**Purpose**: Content posts with tenant context  
**Source**: Direct usage in `main.go` SQL queries

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);
```

**Key Relationships**:
- Belongs to `users` via `user_id`
- Belongs to `sites` via `site_id`

### CIAM Tables

#### 5. ciam_systems
**Purpose**: Configuration for different CIAM systems  
**Source**: Requirements for multi-CIAM support

```sql
CREATE TABLE ciam_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    jwks_url TEXT,
    issuer_url TEXT,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Supported Systems**:
- `cognito` - AWS Cognito
- `azure_entra` - Microsoft Azure Entra ID
- `auth0` - Auth0 (future)
- `okta` - Okta (future)

#### 6. user_ciam_mappings
**Purpose**: Mappings between app users and CIAM identities  
**Source**: Requirements for multi-CIAM support

```sql
CREATE TABLE user_ciam_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ciam_identifier VARCHAR(255) NOT NULL,
    ciam_system VARCHAR(50) NOT NULL,
    ciam_user_pool_id VARCHAR(100),
    ciam_tenant_id VARCHAR(100),
    is_current_ciam BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(app_user_id, ciam_identifier, ciam_system)
);
```

**Key Features**:
- Multiple CIAM systems per user
- Single current active CIAM per user
- Historical tracking of CIAM associations

### Configuration Tables

#### 7. azure_entra_config
**Purpose**: Azure Entra ID configuration settings  
**Source**: Azure auth handlers

```sql
CREATE TABLE azure_entra_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    authority_url VARCHAR(500) NOT NULL,
    redirect_uri VARCHAR(500) NOT NULL,
    scope VARCHAR(500) NOT NULL,
    response_type VARCHAR(50) NOT NULL DEFAULT 'code',
    response_mode VARCHAR(50) NOT NULL DEFAULT 'query',
    code_challenge_method VARCHAR(50) NOT NULL DEFAULT 'S256',
    token_endpoint VARCHAR(500) NOT NULL,
    userinfo_endpoint VARCHAR(500) NOT NULL,
    jwks_uri VARCHAR(500) NOT NULL,
    issuer VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 8. schema_migrations
**Purpose**: Migration tracking and version control  
**Source**: Migration system requirements

```sql
CREATE TABLE schema_migrations (
    version BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);
```

## Indexing Strategy

### Performance Indexes
The schema includes comprehensive indexing for optimal query performance:

#### Customer Indexes
- `idx_customers_status` - Filter by status
- `idx_customers_email` - Unique email lookups

#### Site Indexes
- `idx_sites_customer_id` - Customer's sites
- `idx_sites_slug` - Slug-based lookups
- `idx_sites_status` - Status filtering

#### User Indexes
- `idx_users_email` - Email-based authentication
- `idx_users_azure_entra_id` - Azure authentication
- `idx_users_azure_object_id` - Azure object lookups
- `idx_users_cognito_sub` - Cognito authentication
- `idx_users_auth_method` - Authentication method filtering

#### Post Indexes
- `idx_posts_user_id` - User's posts
- `idx_posts_site_id` - Site's posts
- `idx_posts_slug` - Slug-based lookups
- `idx_posts_published` - Published content
- `idx_posts_published_at` - Chronological ordering

#### CIAM Indexes
- `idx_user_ciam_mappings_current` - Current CIAM per user
- `idx_user_ciam_mappings_system` - CIAM system filtering

### Partial Indexes
Most indexes include `WHERE deleted_at IS NULL` to exclude soft-deleted records, improving performance and reducing index size.

## Data Relationships

### Entity Relationship Diagram
```
customers (1) -----> (N) sites (1) -----> (N) posts
    |                                        ^
    |                                        |
    v                                        |
users (1) -----> (N) user_ciam_mappings     |
    |                                        |
    v                                        |
(N) posts <----------------------------------+
```

### Key Relationships
1. **Customer → Sites**: One customer can have multiple sites
2. **Site → Posts**: One site can have multiple posts
3. **User → Posts**: One user can create multiple posts
4. **User → CIAM Mappings**: One user can have multiple CIAM associations
5. **CIAM System → Mappings**: One CIAM system can have multiple user mappings

## Migration Strategy

### Migration Files
1. **001_initial_schema.sql** - Base schema with Azure Entra ID support
2. **002_cognito_ciam_support.sql** - Cognito and multi-CIAM support

### Migration Features
- **Idempotent Operations**: All migrations can be run multiple times safely
- **Version Tracking**: Complete migration history in `schema_migrations`
- **Rollback Safety**: Additive changes only, no destructive operations
- **Data Migration**: Automatic migration of existing Azure users to CIAM mappings

### Migration Runner
- **Automated Execution**: `run_migrations.sh` script for easy deployment
- **Status Checking**: Prevents duplicate migration execution
- **Error Handling**: Comprehensive error reporting and logging
- **Environment Support**: Configurable via environment variables

## Compliance with Global Instructions

### Requirements Alignment
✅ **Database schema and migration scripts are in `/app-api/migrations`**  
✅ **Any updates result in migration scripts**  
✅ **Schema supports current application functionality**  
✅ **Multi-CIAM support for future authentication providers**  
✅ **Proper version tracking and migration history**

### Implementation Status
- **Current Schema**: ✅ Fully documented and migrated
- **Cognito Support**: ✅ Ready for implementation
- **Multi-CIAM**: ✅ Schema supports multiple authentication providers
- **Migration System**: ✅ Automated and production-ready

## Future Considerations

### Scalability
- **Partitioning**: Consider table partitioning for large datasets
- **Sharding**: Multi-tenant sharding strategies
- **Caching**: Redis integration for frequently accessed data

### Security
- **Encryption**: Field-level encryption for sensitive data
- **Audit Logging**: Comprehensive audit trail implementation
- **Access Control**: Row-level security for multi-tenant isolation

### Performance
- **Query Optimization**: Continuous monitoring and optimization
- **Index Maintenance**: Regular index analysis and cleanup
- **Connection Pooling**: Optimized database connection management

---

## Conclusion

The database schema analysis reveals a well-structured, multitenant system with comprehensive CIAM support. The migration scripts properly align with the current application code and provide a solid foundation for future development. The schema supports both current Azure Entra ID integration and future Cognito implementation while maintaining backward compatibility and data integrity.
