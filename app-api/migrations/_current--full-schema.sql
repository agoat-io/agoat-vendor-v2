-- Current Full Schema: _current--full-schema.sql
-- Description: Complete database schema for AGoat Publisher with OIDC-agnostic CIAM support (no backward compatibility)
-- Date: 2025-10-01
-- Author: AGoat Publisher Team
-- 
-- This file contains the complete current database schema combining all migrations:
-- - 001_initial_schema.sql: Base tables and Azure Entra ID support
-- - 002_cognito_ciam_support.sql: Cognito and multi-CIAM support
-- - 003_oidc_agnostic_ciam_support.sql: OIDC-agnostic CIAM system
-- - 004_remove_cognito_backward_compatibility.sql: Remove backward compatibility
-- - 005_generic_content_management.sql: Generic content management system
-- - 005a_support_multiple_providers_same_type.sql: Support multiple CIAM providers of same type
-- - 006_migrate_thorne_to_generic.sql: Migrate Thorne content to generic format (data migration)
-- - 007_add_hostname_mapping.sql: Add hostname to site_id mapping for multi-tenant hosting
-- - 008_create_platform_tables.sql: Create platform tables for cross-tenant functionality (auth, users, database connections)
-- - 009_add_comprehensive_schema_comments.sql: Add comprehensive comments to all SQL schema definitions including user pool and app client identifiers
-- - 010_restructure_platform_employee_tenant_admin.sql: Restructure platform tables for employees and tenant admins, add platform roles and permissions
-- - 009_multi_level_permission_system.sql: Implement multi-level permission system with provider/tenant/site permissions, CIAM pools, and tenant ownership
-- - 011_add_tenant_ciam_configuration.sql: Add CIAM configuration to tenant (customers) table
--
-- This schema represents the current state after all migrations have been applied.
-- OIDC provider alignment is ONLY through the user_ciam_mappings table.
-- Content management is now generic and site-agnostic.

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID extension for better distribution (CockroachDB has gen_random_uuid() built-in)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PLATFORM TABLES (Cross-Tenant, Will Be Moved to Separate Database)
-- =============================================================================
-- These tables handle cross-tenant functionality and will eventually be moved
-- to a separate platform database for proper multi-tenancy support.
-- They use the "platform_" prefix and should NOT reference tenant-specific tables.

-- Platform users table (cross-tenant user accounts)
-- Purpose: Central user registry for all platform users (employees and customers)
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: id (primary), email (unique), username (optional)
-- App Client Identifier: None (user table, not client table)
CREATE TABLE platform_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- User Pool Unique Identifier: Primary key for user identification
    username VARCHAR(255), -- User Pool Identifier: Optional username for user identification
    email VARCHAR(255) UNIQUE NOT NULL, -- User Pool Unique Identifier: Primary email for user identification and login
    email_verified BOOLEAN DEFAULT false, -- User verification status for email address
    phone_number VARCHAR(50), -- User contact information (phone number)
    phone_verified BOOLEAN DEFAULT false, -- User verification status for phone number
    full_name VARCHAR(255), -- User's display name (first and last name)
    avatar_url TEXT, -- URL to user's profile picture/avatar
    locale VARCHAR(10) DEFAULT 'en', -- User's preferred language/locale (ISO 639-1)
    timezone VARCHAR(50) DEFAULT 'UTC', -- User's preferred timezone
    is_active BOOLEAN DEFAULT true, -- Whether user account is active and can log in
    is_platform_admin BOOLEAN DEFAULT false, -- Whether user has platform-level administrative privileges
    pool_type VARCHAR(50) NOT NULL DEFAULT 'employee' CHECK (pool_type IN ('employee', 'customer_tenant_admin')), -- User Pool Type: Determines which CIAM pool user belongs to
    has_provider_permissions BOOLEAN DEFAULT false, -- Whether user has provider organization level permissions (SaaS company employees)
    last_login_at TIMESTAMP WITH TIME ZONE, -- Timestamp of user's last successful login
    failed_login_attempts INTEGER DEFAULT 0, -- Number of consecutive failed login attempts
    locked_until TIMESTAMP WITH TIME ZONE, -- Timestamp until which account is locked due to failed attempts
    password_changed_at TIMESTAMP WITH TIME ZONE, -- Timestamp when password was last changed
    employee_id VARCHAR(100), -- Employee ID for company employees
    department VARCHAR(100), -- Department for employees
    job_title VARCHAR(100), -- Job title for employees
    manager_user_id UUID REFERENCES platform_users(id), -- Manager for employees
    is_superadmin BOOLEAN DEFAULT false, -- Superadmin flag for user emulation
    last_platform_login_at TIMESTAMP WITH TIME ZONE, -- Last platform login
    platform_login_count INTEGER DEFAULT 0, -- Platform login count
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- Platform CIAM systems (authentication providers)
-- Purpose: Configuration for authentication providers (Cognito, Azure, Auth0, etc.)
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: None (provider configuration table)
-- App Client Identifier: client_id (OAuth/OIDC client identifier)
CREATE TABLE platform_ciam_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for CIAM system identification
    system_name VARCHAR(100) NOT NULL, -- Internal system name for CIAM provider (e.g., 'cognito-employee-pool')
    display_name VARCHAR(255) NOT NULL, -- Human-readable display name for CIAM provider
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('oidc', 'cognito', 'azure', 'auth0', 'okta', 'google', 'custom')), -- Type of authentication provider
    provider_instance_id VARCHAR(255) NOT NULL DEFAULT 'default', -- Instance identifier for provider (allows multiple instances of same type)
    provider_environment VARCHAR(50) DEFAULT 'production', -- Environment (production, staging, development)
    provider_region VARCHAR(50), -- Geographic region for provider (e.g., 'us-east-1')
    provider_domain VARCHAR(255), -- Custom domain for provider (if applicable)
    pool_type VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (pool_type IN ('employee', 'customer')), -- User Pool Type: Which user pool this CIAM system serves
    is_active BOOLEAN DEFAULT true, -- Whether this CIAM system is active and can be used
    is_default_for_type BOOLEAN DEFAULT false, -- Whether this is the default CIAM system for its provider type
    jwks_url TEXT, -- JSON Web Key Set URL for token verification
    issuer_url TEXT NOT NULL, -- OIDC issuer URL for token validation
    oidc_discovery_url TEXT, -- OIDC discovery endpoint URL
    authorization_endpoint TEXT, -- OAuth authorization endpoint URL
    token_endpoint TEXT, -- OAuth token endpoint URL
    userinfo_endpoint TEXT, -- OIDC userinfo endpoint URL
    end_session_endpoint TEXT, -- OIDC end session endpoint URL
    revocation_endpoint TEXT, -- OAuth token revocation endpoint URL
    client_id VARCHAR(255) NOT NULL, -- App Client Unique Identifier: OAuth/OIDC client ID for this application
    client_secret_key_name VARCHAR(255), -- Keyvault secret name containing client secret (not stored in DB)
    scopes TEXT NOT NULL DEFAULT 'openid profile email', -- OAuth scopes requested from provider
    response_type VARCHAR(50) NOT NULL DEFAULT 'code', -- OAuth response type (authorization code flow)
    response_mode VARCHAR(50) DEFAULT 'query', -- OAuth response mode (query, fragment, form_post)
    code_challenge_method VARCHAR(10) DEFAULT 'S256', -- PKCE code challenge method
    supported_claims JSONB DEFAULT '[]', -- JSON array of supported claims from provider
    custom_claims_mapping JSONB DEFAULT '{}', -- JSON object mapping provider claims to platform claims
    provider_metadata JSONB DEFAULT '{}', -- Additional provider-specific metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(system_name, provider_instance_id) -- Unique constraint on system name and instance ID
);

-- Platform user to CIAM mappings
-- Purpose: Links platform users to their authentication provider accounts
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (mapping table, not client table)
CREATE TABLE platform_user_ciam_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for mapping identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    ciam_system_id UUID NOT NULL REFERENCES platform_ciam_systems(id) ON DELETE CASCADE, -- References CIAM system configuration
    provider_user_id VARCHAR(255) NOT NULL, -- User Pool Identifier: User ID from external provider (e.g., Cognito sub)
    provider_username VARCHAR(255), -- Username from external provider (if different from platform username)
    provider_email VARCHAR(255), -- Email from external provider (if different from platform email)
    provider_instance_id VARCHAR(255), -- Instance ID of provider (for multi-instance providers)
    last_authenticated_at TIMESTAMP WITH TIME ZONE, -- Timestamp of last successful authentication via this provider
    authentication_count INTEGER DEFAULT 0, -- Total number of successful authentications via this provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(ciam_system_id, provider_user_id) -- Unique constraint: one mapping per provider user per CIAM system
);

-- Platform OIDC tokens
-- Purpose: Stores OIDC/OAuth tokens for authenticated users
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (token storage table, not client table)
CREATE TABLE platform_oidc_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for token identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    ciam_system_id UUID NOT NULL REFERENCES platform_ciam_systems(id) ON DELETE CASCADE, -- References CIAM system that issued token
    provider_instance_id VARCHAR(255), -- Instance ID of provider that issued token
    token_type VARCHAR(50) NOT NULL DEFAULT 'Bearer', -- OAuth token type (Bearer, etc.)
    access_token TEXT NOT NULL, -- OAuth access token (encrypted in production)
    refresh_token TEXT, -- OAuth refresh token (encrypted in production)
    id_token TEXT, -- OIDC ID token (encrypted in production)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Access token expiration timestamp
    refresh_expires_at TIMESTAMP WITH TIME ZONE, -- Refresh token expiration timestamp
    scope TEXT, -- OAuth scopes granted with this token
    is_revoked BOOLEAN DEFAULT false, -- Whether token has been revoked
    revoked_at TIMESTAMP WITH TIME ZONE, -- Timestamp when token was revoked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Record last update timestamp
);

-- Platform OIDC sessions
-- Purpose: Manages user sessions for OIDC authentication flows
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (session management table, not client table)
CREATE TABLE platform_oidc_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for session identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    ciam_system_id UUID NOT NULL REFERENCES platform_ciam_systems(id) ON DELETE CASCADE, -- References CIAM system for this session
    provider_instance_id VARCHAR(255), -- Instance ID of provider for this session
    session_token VARCHAR(500) NOT NULL UNIQUE, -- Unique session token for this session
    state VARCHAR(500), -- OAuth state parameter for CSRF protection
    nonce VARCHAR(500), -- OIDC nonce parameter for replay attack protection
    code_verifier VARCHAR(500), -- PKCE code verifier for OAuth flow
    return_url TEXT, -- URL to redirect user to after authentication
    ip_address VARCHAR(45), -- IP address of user's session (IPv4 or IPv6)
    user_agent TEXT, -- User agent string from user's browser
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Session expiration timestamp
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Timestamp of last activity in this session
    is_active BOOLEAN DEFAULT true, -- Whether session is currently active
    ended_at TIMESTAMP WITH TIME ZONE, -- Timestamp when session was ended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Record last update timestamp
);

-- Platform tenant databases (database connection info per tenant)
-- Purpose: Stores database connection information for each tenant
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: None (database configuration table)
-- App Client Identifier: None (database configuration table)
CREATE TABLE platform_tenant_databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for database configuration identification
    tenant_id UUID NOT NULL, -- Tenant identifier (NO FK - cross-database ready)
    tenant_slug VARCHAR(255) NOT NULL, -- Human-readable tenant identifier
    database_type VARCHAR(50) NOT NULL CHECK (database_type IN ('shared', 'dedicated', 'cluster')), -- Type of database deployment
    connection_string_key_name VARCHAR(255) NOT NULL, -- Keyvault secret name containing full connection string
    database_name VARCHAR(255) NOT NULL, -- Name of the database
    database_host VARCHAR(255) NOT NULL, -- Database server hostname or IP
    database_port INTEGER NOT NULL DEFAULT 26257, -- Database server port (default: CockroachDB)
    database_user_key_name VARCHAR(255), -- Keyvault secret name containing database username
    database_password_key_name VARCHAR(255), -- Keyvault secret name containing database password
    ssl_enabled BOOLEAN DEFAULT true, -- Whether SSL/TLS is enabled for database connections
    ssl_cert_key_name VARCHAR(255), -- Keyvault secret name containing SSL certificate
    connection_pool_size INTEGER DEFAULT 10, -- Maximum number of connections in pool
    connection_timeout_seconds INTEGER DEFAULT 30, -- Connection timeout in seconds
    is_active BOOLEAN DEFAULT true, -- Whether this database configuration is active
    is_primary BOOLEAN DEFAULT true, -- Whether this is the primary database for the tenant
    read_only BOOLEAN DEFAULT false, -- Whether this database is read-only
    region VARCHAR(50), -- Geographic region of database (e.g., 'us-east-1')
    provider VARCHAR(50) CHECK (provider IN ('cockroachdb', 'postgresql', 'azure', 'aws', 'gcp')), -- Database provider
    metadata JSONB DEFAULT '{}', -- Additional database-specific metadata
    health_check_url TEXT, -- URL for database health checks
    last_health_check_at TIMESTAMP WITH TIME ZONE, -- Timestamp of last health check
    last_health_status VARCHAR(50), -- Result of last health check (healthy, unhealthy, unknown)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(tenant_id, database_name) -- Unique constraint: one config per tenant per database name
);

-- Platform keyvault secrets (centralized secret management)
-- Purpose: References to secrets stored in external keyvault systems
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: None (secret management table)
-- App Client Identifier: None (secret management table)
CREATE TABLE platform_keyvault_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for secret reference identification
    secret_name VARCHAR(255) NOT NULL UNIQUE, -- Unique name for the secret (e.g., 'tenant-db-connection-string')
    secret_type VARCHAR(50) NOT NULL CHECK (secret_type IN ('connection_string', 'password', 'api_key', 'certificate', 'token', 'other')), -- Type of secret
    keyvault_provider VARCHAR(50) NOT NULL CHECK (keyvault_provider IN ('azure', 'aws', 'gcp', 'hashicorp', 'local')), -- Keyvault provider (Azure Key Vault, AWS Secrets Manager, etc.)
    keyvault_name VARCHAR(255) NOT NULL, -- Name of the keyvault instance
    secret_identifier TEXT NOT NULL, -- Full path/identifier to secret in keyvault
    version VARCHAR(50), -- Version of the secret (if versioned)
    description TEXT, -- Human-readable description of the secret
    rotation_enabled BOOLEAN DEFAULT false, -- Whether secret rotation is enabled
    rotation_interval_days INTEGER, -- Number of days between secret rotations
    last_rotated_at TIMESTAMP WITH TIME ZONE, -- Timestamp of last secret rotation
    next_rotation_at TIMESTAMP WITH TIME ZONE, -- Timestamp of next scheduled rotation
    is_active BOOLEAN DEFAULT true, -- Whether this secret reference is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- Platform tenant access mapping (which platform users can access which tenants)
-- Purpose: Controls which platform users can access which tenants with what roles
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (access control table, not client table)
CREATE TABLE platform_tenant_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for access mapping identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    tenant_id UUID NOT NULL, -- Tenant identifier (NO FK - cross-database ready)
    tenant_slug VARCHAR(255) NOT NULL, -- Human-readable tenant identifier
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'billing')), -- Role within the tenant
    permissions JSONB DEFAULT '[]', -- JSON array of specific permissions for this user-tenant combination
    is_active BOOLEAN DEFAULT true, -- Whether this access mapping is active
    invited_by_user_id UUID REFERENCES platform_users(id), -- User who invited this user to the tenant
    invitation_accepted_at TIMESTAMP WITH TIME ZONE, -- Timestamp when invitation was accepted
    last_access_at TIMESTAMP WITH TIME ZONE, -- Timestamp of last access to this tenant
    access_count INTEGER DEFAULT 0, -- Total number of times user has accessed this tenant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(user_id, tenant_id) -- Unique constraint: one access mapping per user per tenant
);

-- Platform provider organization permissions (SaaS company employees)
-- Purpose: Provider organization level permissions for SaaS company employees (cross-tenant access)
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (permission table, not client table)
CREATE TABLE platform_provider_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for permission identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('full_access', 'support', 'billing', 'technical', 'read_only')), -- Type of provider permission
    scope JSONB DEFAULT '{}', -- JSON object defining scope of permissions (can specify specific tenants/sites or "all")
    is_active BOOLEAN DEFAULT true, -- Whether this permission is active
    granted_by_user_id UUID REFERENCES platform_users(id), -- User who granted this permission
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Timestamp when permission was granted
    expires_at TIMESTAMP WITH TIME ZONE, -- Timestamp when permission expires (NULL = permanent)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(user_id, permission_type) -- Unique constraint: one permission per type per user
);

-- Platform tenant permissions (customer owners and their team)
-- Purpose: Tenant level permissions for customer owners and their team members
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (permission table, not client table)
CREATE TABLE platform_tenant_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for permission identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    tenant_id UUID NOT NULL, -- Tenant identifier (NO FK - cross-database ready)
    tenant_slug VARCHAR(255) NOT NULL, -- Human-readable tenant identifier
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('owner', 'admin', 'member', 'viewer', 'billing')), -- Type of tenant permission
    permissions JSONB DEFAULT '[]', -- JSON array of specific permissions for this user-tenant combination
    is_active BOOLEAN DEFAULT true, -- Whether this permission is active
    granted_by_user_id UUID REFERENCES platform_users(id), -- User who granted this permission
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Timestamp when permission was granted
    expires_at TIMESTAMP WITH TIME ZONE, -- Timestamp when permission expires (NULL = permanent)
    last_access_at TIMESTAMP WITH TIME ZONE, -- Timestamp of last access to this tenant
    access_count INTEGER DEFAULT 0, -- Total number of times user has accessed this tenant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(user_id, tenant_id) -- Unique constraint: one permission per user per tenant
);

-- Platform site permissions (site-specific access)
-- Purpose: Site level permissions for specific site access within tenants
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (permission table, not client table)
CREATE TABLE platform_site_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for permission identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    site_id UUID NOT NULL, -- Site identifier (NO FK - cross-database ready)
    site_slug VARCHAR(255) NOT NULL, -- Human-readable site identifier
    tenant_id UUID NOT NULL, -- Tenant identifier for cross-database queries
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('owner', 'admin', 'editor', 'viewer', 'api_access')), -- Type of site permission
    permissions JSONB DEFAULT '[]', -- JSON array of specific permissions for this user-site combination
    is_active BOOLEAN DEFAULT true, -- Whether this permission is active
    granted_by_user_id UUID REFERENCES platform_users(id), -- User who granted this permission
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Timestamp when permission was granted
    expires_at TIMESTAMP WITH TIME ZONE, -- Timestamp when permission expires (NULL = permanent)
    last_access_at TIMESTAMP WITH TIME ZONE, -- Timestamp of last access to this site
    access_count INTEGER DEFAULT 0, -- Total number of times user has accessed this site
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(user_id, site_id) -- Unique constraint: one permission per user per site
);

-- Platform hierarchical sessions (tenant and site level)
-- Purpose: Hierarchical session management for tenant and site level access
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (session management table, not client table)
CREATE TABLE platform_hierarchical_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for session identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('tenant', 'site')), -- Type of session (tenant-level or site-level)
    tenant_id UUID, -- Tenant identifier for tenant-level sessions
    site_id UUID, -- Site identifier for site-level sessions
    parent_session_id UUID REFERENCES platform_hierarchical_sessions(id), -- Parent session ID for site sessions created from tenant sessions
    session_token VARCHAR(500) NOT NULL UNIQUE, -- Unique session token for this session
    tenant_token VARCHAR(500), -- Tenant token for site sessions (stores the parent tenant token)
    ciam_system_id UUID NOT NULL REFERENCES platform_ciam_systems(id), -- References CIAM system for this session
    provider_instance_id VARCHAR(255), -- Instance ID of provider for this session
    ip_address VARCHAR(45), -- IP address of user's session (IPv4 or IPv6)
    user_agent TEXT, -- User agent string from user's browser
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Session expiration timestamp
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Timestamp of last activity in this session
    is_active BOOLEAN DEFAULT true, -- Whether session is currently active
    ended_at TIMESTAMP WITH TIME ZONE, -- Timestamp when session was ended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Record last update timestamp
);

-- Platform permission inheritance rules
-- Purpose: Rules for how permissions inherit from higher levels to lower levels
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: None (rule configuration table)
-- App Client Identifier: None (rule configuration table)
CREATE TABLE platform_permission_inheritance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for inheritance rule identification
    parent_permission_type VARCHAR(50) NOT NULL CHECK (parent_permission_type IN ('provider', 'tenant', 'site')), -- Parent permission level
    child_permission_type VARCHAR(50) NOT NULL CHECK (child_permission_type IN ('tenant', 'site')), -- Child permission level
    inheritance_rule JSONB NOT NULL, -- JSON object defining how permissions inherit from parent to child level
    is_active BOOLEAN DEFAULT true, -- Whether this inheritance rule is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(parent_permission_type, child_permission_type) -- Unique constraint: one rule per parent-child combination
);

-- Platform roles for employees and tenant admins
-- Purpose: Platform-level roles for employees and tenant admins
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: None (role definition table)
-- App Client Identifier: None (role definition table)
CREATE TABLE platform_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for role identification
    name VARCHAR(100) NOT NULL UNIQUE, -- Role name (e.g., 'superadmin', 'platform_admin', 'tenant_admin', 'support')
    display_name VARCHAR(255) NOT NULL, -- Human-readable role name
    description TEXT, -- Role description
    is_system_role BOOLEAN DEFAULT false, -- Whether this is a system-defined role
    permissions JSONB DEFAULT '[]', -- JSON array of permissions for this role
    is_active BOOLEAN DEFAULT true, -- Whether role is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- Platform user role assignments
-- Purpose: Platform-level user role assignments
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: user_id (references platform_users.id)
-- App Client Identifier: None (role assignment table)
CREATE TABLE platform_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for user role assignment identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    role_id UUID NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE, -- References platform role
    granted_by_user_id UUID REFERENCES platform_users(id), -- User who granted this role
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When role was granted
    expires_at TIMESTAMP WITH TIME ZONE, -- When role expires (NULL = permanent)
    is_active BOOLEAN DEFAULT true, -- Whether role assignment is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(user_id, role_id) -- Unique constraint: one role assignment per user per role
);

-- Platform permissions for fine-grained access control
-- Purpose: Platform-level permissions for fine-grained access control
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: None (permission definition table)
-- App Client Identifier: None (permission definition table)
CREATE TABLE platform_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for permission identification
    name VARCHAR(100) NOT NULL UNIQUE, -- Permission name (e.g., 'tenant.create', 'site.manage', 'user.emulate')
    display_name VARCHAR(255) NOT NULL, -- Human-readable permission name
    description TEXT, -- Permission description
    resource_type VARCHAR(100) NOT NULL, -- Resource type (e.g., 'tenant', 'site', 'user', 'platform')
    action VARCHAR(100) NOT NULL, -- Action (e.g., 'create', 'read', 'update', 'delete', 'manage', 'emulate')
    is_system_permission BOOLEAN DEFAULT false, -- Whether this is a system-defined permission
    is_active BOOLEAN DEFAULT true, -- Whether permission is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- User emulation sessions for superadmins
-- Purpose: User emulation sessions for superadmins
-- Cross-database ready: Will be moved to separate platform database
-- User Pool Identifier: emulator_user_id (references platform_users.id), emulated_user_id (cross-database)
-- App Client Identifier: None (emulation session table)
CREATE TABLE platform_user_emulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for emulation identification
    emulator_user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: Platform user doing the emulation
    emulated_user_id UUID NOT NULL, -- User Pool Identifier: User being emulated (NO FK - cross-database)
    emulated_site_id UUID NOT NULL, -- Site being emulated (NO FK - cross-database)
    emulated_tenant_id UUID NOT NULL, -- Tenant being emulated (NO FK - cross-database)
    emulation_token VARCHAR(500) NOT NULL UNIQUE, -- Unique emulation session token
    emulation_cookie_domain VARCHAR(255) NOT NULL, -- Domain for emulation cookie
    emulation_cookie_name VARCHAR(100) NOT NULL DEFAULT 'emulation_session', -- Cookie name
    emulation_cookie_value VARCHAR(500) NOT NULL, -- Cookie value
    emulation_cookie_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Cookie expiration
    ip_address VARCHAR(45), -- IP address of emulator
    user_agent TEXT, -- User agent of emulator
    emulation_reason TEXT, -- Reason for emulation (audit trail)
    is_active BOOLEAN DEFAULT true, -- Whether emulation is active
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When emulation started
    ended_at TIMESTAMP WITH TIME ZONE, -- When emulation ended
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last activity in emulation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Record last update timestamp
);

-- =============================================================================
-- CORE BUSINESS TABLES
-- =============================================================================

-- Customer accounts for multitenant architecture
-- Purpose: Tenant/customer accounts in the multi-tenant SaaS platform
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: owner_user_id (references platform_users.id)
-- App Client Identifier: None (tenant table, not client table)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for customer/tenant identification
    name VARCHAR(255) NOT NULL, -- Customer/tenant display name
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier for customer/tenant
    email VARCHAR(255) UNIQUE NOT NULL, -- Primary contact email for customer/tenant
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')), -- Current status of customer/tenant
    subscription_plan VARCHAR(100) NOT NULL DEFAULT 'basic', -- Subscription plan (basic, premium, enterprise, etc.)
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')), -- Subscription status
    trial_ends_at TIMESTAMP WITH TIME ZONE, -- When trial period ends (if applicable)
    subscription_ends_at TIMESTAMP WITH TIME ZONE, -- When subscription ends (if applicable)
    max_sites INTEGER NOT NULL DEFAULT 1, -- Maximum number of sites allowed for this customer
    max_storage_gb INTEGER NOT NULL DEFAULT 10, -- Maximum storage in GB allowed for this customer
    max_bandwidth_gb INTEGER NOT NULL DEFAULT 100, -- Maximum bandwidth in GB allowed for this customer
    tenant_owner_type VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (tenant_owner_type IN ('saas_company', 'customer')), -- Who owns this tenant (SaaS company or customer)
    owner_user_id UUID REFERENCES platform_users(id), -- User Pool Identifier: References platform user who owns this tenant
    is_shared_tenant BOOLEAN DEFAULT false, -- Whether this tenant is shared among multiple customers
    ciam_system_id UUID REFERENCES platform_ciam_systems(id), -- References CIAM system for tenant-level authentication (overrides platform default)
    has_custom_ciam BOOLEAN DEFAULT false, -- Whether this tenant has custom CIAM configuration
    ciam_settings JSONB DEFAULT '{}', -- Tenant-specific CIAM settings and configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- Sites belonging to customers
-- Purpose: Individual websites/sites within customer tenants
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (site table, not user table)
-- App Client Identifier: None (site table, not client table)
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for site identification
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE, -- References customer/tenant that owns this site
    name VARCHAR(255) NOT NULL, -- Site display name
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier for site
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')), -- Current status of site
    template VARCHAR(100) DEFAULT 'default', -- Template used for this site
    ciam_system_id UUID REFERENCES platform_ciam_systems(id), -- References CIAM system for site-specific authentication
    has_custom_ciam BOOLEAN DEFAULT false, -- Whether this site has custom CIAM configuration
    settings JSONB NOT NULL DEFAULT '{}', -- Site-specific settings and configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(customer_id, slug) -- Unique constraint: one site per slug per customer
);

-- User accounts with OIDC-compliant authentication support only
-- Purpose: Legacy user accounts (deprecated - use platform_users instead)
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: id (primary), email (unique), username (unique), oidc_sub (OIDC subject)
-- App Client Identifier: oidc_audience (OIDC audience claim)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- User Pool Unique Identifier: Primary key for user identification
    username VARCHAR(255) NOT NULL, -- User Pool Identifier: Username for user identification
    email VARCHAR(255) UNIQUE NOT NULL, -- User Pool Unique Identifier: Email for user identification and login
    password_hash VARCHAR(255), -- Can be NULL if only external auth is used
    
    -- OIDC Standard Claims - from JWT ID tokens
    oidc_sub VARCHAR(255), -- User Pool Unique Identifier: OIDC 'sub' claim - unique subject identifier
    oidc_issuer VARCHAR(255), -- OIDC 'iss' claim - token issuer
    oidc_audience VARCHAR(255), -- App Client Unique Identifier: OIDC 'aud' claim - intended audience
    
    -- Standard User Profile Fields - from OIDC standard claims
    phone_number VARCHAR(50), -- User's phone number
    phone_number_verified BOOLEAN DEFAULT FALSE, -- Phone verification status
    given_name VARCHAR(255), -- User's first name
    family_name VARCHAR(255), -- User's last name
    name VARCHAR(255), -- User's full name
    preferred_username VARCHAR(255), -- User's preferred username
    locale VARCHAR(10), -- User's locale preference
    timezone VARCHAR(50), -- User's timezone
    
    -- Authentication and status
    auth_method VARCHAR(50) DEFAULT 'local' CHECK (auth_method IN ('local', 'oidc')), -- Authentication method used
    email_verified BOOLEAN DEFAULT false, -- Whether email address is verified
    account_enabled BOOLEAN DEFAULT true, -- Whether user account is enabled
    last_login_at TIMESTAMP WITH TIME ZONE, -- Timestamp of user's last successful login
    
    -- OIDC Timestamps - from provider user creation/update events
    oidc_created_at TIMESTAMP WITH TIME ZONE, -- When user was created in OIDC provider
    oidc_updated_at TIMESTAMP WITH TIME ZONE, -- When user was last updated in OIDC provider
    
    -- Provider-specific metadata - flexible storage for provider-specific data
    provider_metadata JSONB DEFAULT '{}', -- Provider-specific user data
    
    -- Standard timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- Content posts with tenant context
-- Purpose: Content posts/articles within sites
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: user_id (references users.id)
-- App Client Identifier: None (content table, not client table)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for post identification
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User Pool Identifier: References user who created the post
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that contains this post
    title VARCHAR(255) NOT NULL, -- Post title
    content TEXT NOT NULL, -- Post content (HTML, Markdown, etc.)
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier for post
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')), -- Post status
    published BOOLEAN DEFAULT false, -- Whether post is published (legacy field)
    published_at TIMESTAMP WITH TIME ZONE, -- When post was published
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- =============================================================================
-- CIAM (CUSTOMER IDENTITY AND ACCESS MANAGEMENT) TABLES
-- =============================================================================

-- OIDC-compliant CIAM system configurations supporting multiple providers
-- Purpose: Configuration for authentication providers (Cognito, Azure, Auth0, etc.)
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (provider configuration table)
-- App Client Identifier: client_id (OAuth/OIDC client identifier)
CREATE TABLE ciam_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for CIAM system identification
    system_name VARCHAR(50) NOT NULL, -- 'cognito', 'azure_entra', 'auth0', etc.
    display_name VARCHAR(100) NOT NULL, -- Human-readable display name for CIAM provider
    provider_type VARCHAR(50) DEFAULT 'oidc' CHECK (provider_type IN ('oidc', 'oauth2', 'saml', 'custom')), -- Type of authentication provider
    is_active BOOLEAN DEFAULT TRUE, -- Whether this CIAM system is active and can be used
    
    -- Provider instance identification
    provider_instance_id VARCHAR(255) NOT NULL DEFAULT 'default', -- Unique identifier for specific instance/environment/pool
    provider_environment VARCHAR(50) DEFAULT 'production' CHECK (provider_environment IN ('production', 'staging', 'development', 'test', 'local')), -- Environment (production, staging, development)
    provider_region VARCHAR(50), -- Provider region information
    provider_domain VARCHAR(255), -- Provider domain from JWT token iss claim
    is_default_for_type BOOLEAN DEFAULT FALSE, -- Indicates if this is the default provider for this provider_type
    
    -- OIDC Standard Endpoints
    jwks_url TEXT, -- JSON Web Key Set URL for token validation
    issuer_url TEXT, -- OIDC issuer URL
    oidc_discovery_url TEXT, -- OIDC discovery endpoint - where to find all other endpoints automatically
    authorization_endpoint TEXT, -- OAuth2/OIDC Authorization endpoint - where users are redirected to login
    token_endpoint TEXT, -- OAuth2/OIDC Token endpoint - where authorization codes are exchanged for tokens
    userinfo_endpoint TEXT, -- OIDC UserInfo endpoint - where user information is retrieved
    end_session_endpoint TEXT, -- OIDC End Session endpoint - where users are redirected to logout
    
    -- OAuth2/OIDC Configuration
    client_id VARCHAR(255), -- App Client Unique Identifier: OAuth2 Client ID - unique identifier for this application
    client_secret_encrypted TEXT, -- OAuth2 Client Secret - secret key for confidential clients (encrypted)
    scopes TEXT DEFAULT 'openid profile email', -- OAuth2 Scopes - permissions requested from the provider
    response_type VARCHAR(50) DEFAULT 'code', -- OAuth2 Response Type - how the authorization response is returned
    response_mode VARCHAR(50) DEFAULT 'query', -- OAuth2 Response Mode - how the authorization response is delivered
    code_challenge_method VARCHAR(50) DEFAULT 'S256', -- PKCE Code Challenge Method - method for generating code challenges
    
    -- Flexible Configuration
    supported_claims JSONB DEFAULT '{}', -- Supported Claims - JSON schema of claims this provider supports
    provider_metadata JSONB DEFAULT '{}', -- Provider Metadata - provider-specific configuration and settings
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    
    -- Unique constraints for multiple provider support
    UNIQUE (system_name, provider_instance_id), -- Support multiple instances of same provider type
    UNIQUE (provider_type, is_default_for_type) WHERE is_default_for_type = TRUE -- Only one default per provider type
);

-- OIDC provider-agnostic user identity mappings - all provider-specific data stored in provider_metadata JSONB field
-- Purpose: Links users to their authentication provider accounts
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: app_user_id (references users.id), ciam_identifier (OIDC sub claim)
-- App Client Identifier: None (mapping table, not client table)
CREATE TABLE user_ciam_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for mapping identification
    app_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User Pool Identifier: References user
    ciam_identifier VARCHAR(255) NOT NULL, -- User Pool Unique Identifier: OIDC 'sub' claim
    ciam_system VARCHAR(50) NOT NULL, -- 'cognito', 'azure_entra', 'auth0', etc.
    
    -- Provider instance reference
    ciam_system_id UUID REFERENCES ciam_systems(id) ON DELETE CASCADE, -- Direct reference to specific CIAM system instance
    provider_instance_id VARCHAR(255), -- Provider instance identifier for quick lookup
    provider_environment VARCHAR(50), -- Provider environment for audit and debugging
    token_issuer VARCHAR(255), -- JWT token issuer URL for validation
    
    -- Generic provider fields
    provider_identifier VARCHAR(255), -- Generic provider identifier - specific data in provider_metadata
    provider_metadata JSONB DEFAULT '{}', -- All provider-specific data stored here - no provider-specific columns
    last_authenticated_at TIMESTAMP WITH TIME ZONE, -- Last successful authentication timestamp for audit and analytics
    authentication_method VARCHAR(50) DEFAULT 'oidc', -- Authentication method used (OIDC, OAuth2, SAML, etc.)
    token_metadata JSONB DEFAULT '{}', -- Token-related metadata (expiry, scope, claims, etc.)
    
    is_current_ciam BOOLEAN DEFAULT FALSE, -- Indicates if this is the currently active CIAM system for the user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    UNIQUE(app_user_id, ciam_identifier, ciam_system) -- Unique constraint: one mapping per user per provider per identifier
);

-- Secure storage for OIDC tokens with metadata
-- Purpose: Stores OIDC/OAuth tokens for authenticated users
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: user_id (references users.id)
-- App Client Identifier: token_audience (JWT audience claim)
CREATE TABLE oidc_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique token record identifier
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- User Pool Identifier: Reference to user
    ciam_system_id UUID NOT NULL REFERENCES ciam_systems(id) ON DELETE CASCADE, -- Reference to CIAM system
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh', 'id')), -- Type of token
    token_hash VARCHAR(255) NOT NULL, -- Hashed token for security (never store plain tokens)
    token_metadata JSONB DEFAULT '{}', -- Token claims, expiry, scope, etc.
    expires_at TIMESTAMP WITH TIME ZONE, -- When the token expires
    
    -- Provider instance information for token validation
    token_issuer VARCHAR(255), -- JWT token issuer URL for validation
    provider_instance_id VARCHAR(255), -- Provider instance identifier for quick lookup
    token_audience VARCHAR(255), -- App Client Unique Identifier: JWT token audience for validation
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    UNIQUE(user_id, ciam_system_id, token_type) -- One token per type per user per system
);

-- OIDC session management with state and PKCE support
-- Purpose: Manages user sessions for OIDC authentication flows
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: user_id (references users.id)
-- App Client Identifier: None (session management table, not client table)
CREATE TABLE oidc_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique session record identifier
    session_id VARCHAR(255) NOT NULL UNIQUE, -- Unique session identifier
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User Pool Identifier: Reference to user (nullable for anonymous sessions)
    ciam_system_id UUID NOT NULL REFERENCES ciam_systems(id) ON DELETE CASCADE, -- Reference to CIAM system
    state VARCHAR(255) NOT NULL, -- OAuth2 state parameter for CSRF protection
    code_verifier VARCHAR(255), -- PKCE code verifier for enhanced security
    return_url TEXT, -- Return URL after authentication
    session_data JSONB DEFAULT '{}', -- Additional session data and metadata
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When session expires
    
    -- Provider instance information for session management
    provider_instance_id VARCHAR(255), -- Provider instance identifier for quick lookup
    provider_environment VARCHAR(50), -- Provider environment for audit and debugging
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Record last update timestamp
);

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Create schema_migrations table for tracking applied migrations
-- Purpose: Tracks database schema migrations and their execution status
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (migration tracking table)
-- App Client Identifier: None (migration tracking table)
CREATE TABLE schema_migrations (
    version BIGINT PRIMARY KEY, -- Migration version number
    name VARCHAR(255) NOT NULL, -- Migration file name
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When migration was applied
    checksum VARCHAR(64) NOT NULL, -- Checksum of migration file for integrity verification
    execution_time_ms INTEGER, -- How long migration took to execute (in milliseconds)
    status VARCHAR(20) DEFAULT 'success', -- Migration status (success, failed, pending)
    error_message TEXT -- Error message if migration failed
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Customer indexes
CREATE INDEX idx_customers_status ON customers (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_status_subscription ON customers (status, subscription_status);
CREATE INDEX idx_customers_ciam_system_id ON customers(ciam_system_id);

-- Site indexes
CREATE INDEX idx_sites_customer_id ON sites (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_slug ON sites (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_status ON sites (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_sites_customer_id_status ON sites (customer_id, status);

-- User indexes
CREATE INDEX idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_auth_method ON users (auth_method);
CREATE INDEX idx_users_account_enabled ON users (account_enabled) WHERE account_enabled = true;
CREATE INDEX idx_users_oidc_sub ON users (oidc_sub) WHERE oidc_sub IS NOT NULL;
CREATE INDEX idx_users_oidc_issuer ON users (oidc_issuer) WHERE oidc_issuer IS NOT NULL;
CREATE INDEX idx_users_phone_number ON users (phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX idx_users_email_verified ON users (email_verified) WHERE email_verified = TRUE;

-- Post indexes
CREATE INDEX idx_posts_user_id ON posts (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_site_id ON posts (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_slug ON posts (slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_status ON posts (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_published ON posts (published) WHERE published = true AND deleted_at IS NULL;
CREATE INDEX idx_posts_published_at ON posts (published_at DESC) WHERE published = true AND deleted_at IS NULL;
CREATE INDEX idx_posts_site_id_status ON posts (site_id, status);
CREATE INDEX idx_posts_site_id_published_at ON posts (site_id, published_at DESC) WHERE status = 'published';

-- CIAM systems indexes
CREATE INDEX idx_ciam_systems_active ON ciam_systems (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ciam_systems_name ON ciam_systems (system_name);
CREATE INDEX idx_ciam_systems_provider_type ON ciam_systems (provider_type);
CREATE INDEX idx_ciam_systems_client_id ON ciam_systems (client_id) WHERE client_id IS NOT NULL;

-- CIAM systems indexes for multiple provider support
CREATE INDEX idx_ciam_systems_provider_instance_id ON ciam_systems (provider_instance_id);
CREATE INDEX idx_ciam_systems_provider_environment ON ciam_systems (provider_environment);
CREATE INDEX idx_ciam_systems_provider_region ON ciam_systems (provider_region);
CREATE INDEX idx_ciam_systems_provider_domain ON ciam_systems (provider_domain);
CREATE INDEX idx_ciam_systems_default_for_type ON ciam_systems (provider_type, is_default_for_type) WHERE is_default_for_type = TRUE;

-- User CIAM mappings indexes
CREATE INDEX idx_user_ciam_mappings_app_user_id ON user_ciam_mappings (app_user_id);
CREATE INDEX idx_user_ciam_mappings_ciam_identifier ON user_ciam_mappings (ciam_identifier);
CREATE INDEX idx_user_ciam_mappings_current ON user_ciam_mappings (app_user_id, is_current_ciam) WHERE is_current_ciam = TRUE;
CREATE INDEX idx_user_ciam_mappings_system ON user_ciam_mappings (ciam_system);
CREATE INDEX idx_user_ciam_mappings_provider_identifier ON user_ciam_mappings (provider_identifier) WHERE provider_identifier IS NOT NULL;
CREATE INDEX idx_user_ciam_mappings_last_auth ON user_ciam_mappings (last_authenticated_at DESC) WHERE last_authenticated_at IS NOT NULL;

-- User CIAM mappings indexes for multiple provider support
CREATE INDEX idx_user_ciam_mappings_ciam_system_id ON user_ciam_mappings (ciam_system_id);
CREATE INDEX idx_user_ciam_mappings_provider_instance_id ON user_ciam_mappings (provider_instance_id);
CREATE INDEX idx_user_ciam_mappings_provider_environment ON user_ciam_mappings (provider_environment);
CREATE INDEX idx_user_ciam_mappings_token_issuer ON user_ciam_mappings (token_issuer);

-- OIDC tokens indexes
CREATE INDEX idx_oidc_tokens_user_id ON oidc_tokens (user_id);
CREATE INDEX idx_oidc_tokens_ciam_system_id ON oidc_tokens (ciam_system_id);
CREATE INDEX idx_oidc_tokens_expires_at ON oidc_tokens (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_oidc_tokens_type ON oidc_tokens (token_type);

-- OIDC tokens indexes for multiple provider support
CREATE INDEX idx_oidc_tokens_token_issuer ON oidc_tokens (token_issuer);
CREATE INDEX idx_oidc_tokens_provider_instance_id ON oidc_tokens (provider_instance_id);
CREATE INDEX idx_oidc_tokens_token_audience ON oidc_tokens (token_audience);

-- OIDC sessions indexes
CREATE INDEX idx_oidc_sessions_session_id ON oidc_sessions (session_id);
CREATE INDEX idx_oidc_sessions_user_id ON oidc_sessions (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_oidc_sessions_state ON oidc_sessions (state);
CREATE INDEX idx_oidc_sessions_expires_at ON oidc_sessions (expires_at);

-- OIDC sessions indexes for multiple provider support
CREATE INDEX idx_oidc_sessions_provider_instance_id ON oidc_sessions (provider_instance_id);
CREATE INDEX idx_oidc_sessions_provider_environment ON oidc_sessions (provider_environment);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_ciam_systems_updated_at
    BEFORE UPDATE ON ciam_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_ciam_mappings_updated_at
    BEFORE UPDATE ON user_ciam_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_oidc_tokens_updated_at
    BEFORE UPDATE ON oidc_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_oidc_sessions_updated_at
    BEFORE UPDATE ON oidc_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS FOR CIAM MANAGEMENT
-- =============================================================================

-- Function to ensure only one current CIAM per user
CREATE OR REPLACE FUNCTION ensure_single_current_ciam()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_current_ciam to TRUE, set all others for this user to FALSE
    IF NEW.is_current_ciam = TRUE THEN
        UPDATE user_ciam_mappings 
        SET is_current_ciam = FALSE, updated_at = NOW()
        WHERE app_user_id = NEW.app_user_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single current CIAM per user
CREATE TRIGGER trigger_ensure_single_current_ciam
    BEFORE INSERT OR UPDATE ON user_ciam_mappings
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_ciam();

-- Function to validate that user mappings are OIDC compliant
CREATE OR REPLACE FUNCTION validate_oidc_compliance()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure that if a user has OIDC authentication, they have a corresponding mapping
    IF NEW.auth_method = 'oidc' THEN
        IF NOT EXISTS (
            SELECT 1 FROM user_ciam_mappings 
            WHERE app_user_id = NEW.id 
            AND is_current_ciam = TRUE
        ) THEN
            RAISE EXCEPTION 'Users with oidc auth_method must have a current CIAM mapping';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce OIDC compliance
CREATE TRIGGER trigger_validate_oidc_compliance
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_oidc_compliance();

-- Function to get OIDC configuration for a CIAM system
CREATE OR REPLACE FUNCTION get_oidc_config(system_name_param VARCHAR(50))
RETURNS TABLE (
    system_id UUID, -- CIAM system unique identifier
    provider_type VARCHAR(50), -- Type of provider (oidc, oauth2, saml, custom)
    jwks_url TEXT, -- JSON Web Key Set URL for token validation
    issuer_url TEXT, -- OIDC issuer URL
    authorization_endpoint TEXT, -- OAuth2 authorization endpoint
    token_endpoint TEXT, -- OAuth2 token endpoint
    userinfo_endpoint TEXT, -- OIDC userinfo endpoint
    end_session_endpoint TEXT, -- OIDC end session endpoint
    client_id VARCHAR(255), -- OAuth2 client identifier
    scopes TEXT, -- OAuth2 scopes
    response_type VARCHAR(50), -- OAuth2 response type
    response_mode VARCHAR(50), -- OAuth2 response mode
    code_challenge_method VARCHAR(50), -- PKCE code challenge method
    supported_claims JSONB, -- JSON schema of supported claims
    provider_metadata JSONB -- Provider-specific configuration
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.provider_type,
        cs.jwks_url,
        cs.issuer_url,
        cs.authorization_endpoint,
        cs.token_endpoint,
        cs.userinfo_endpoint,
        cs.end_session_endpoint,
        cs.client_id,
        cs.scopes,
        cs.response_type,
        cs.response_mode,
        cs.code_challenge_method,
        cs.supported_claims,
        cs.provider_metadata
    FROM ciam_systems cs
    WHERE cs.system_name = system_name_param 
    AND cs.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get OIDC configuration for a specific provider instance
CREATE OR REPLACE FUNCTION get_oidc_config_by_instance(
    system_name_param VARCHAR(50),
    provider_instance_id_param VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
    system_id UUID,
    provider_type VARCHAR(50),
    provider_instance_id VARCHAR(255),
    provider_environment VARCHAR(50),
    provider_region VARCHAR(50),
    provider_domain VARCHAR(255),
    jwks_url TEXT,
    issuer_url TEXT,
    oidc_discovery_url TEXT,
    authorization_endpoint TEXT,
    token_endpoint TEXT,
    userinfo_endpoint TEXT,
    end_session_endpoint TEXT,
    client_id VARCHAR(255),
    scopes TEXT,
    response_type VARCHAR(50),
    response_mode VARCHAR(50),
    code_challenge_method VARCHAR(50),
    supported_claims JSONB,
    provider_metadata JSONB,
    is_default_for_type BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.provider_type,
        cs.provider_instance_id,
        cs.provider_environment,
        cs.provider_region,
        cs.provider_domain,
        cs.jwks_url,
        cs.issuer_url,
        cs.oidc_discovery_url,
        cs.authorization_endpoint,
        cs.token_endpoint,
        cs.userinfo_endpoint,
        cs.end_session_endpoint,
        cs.client_id,
        cs.scopes,
        cs.response_type,
        cs.response_mode,
        cs.code_challenge_method,
        cs.supported_claims,
        cs.provider_metadata,
        cs.is_default_for_type
    FROM ciam_systems cs
    WHERE cs.system_name = system_name_param 
    AND cs.is_active = TRUE
    AND (provider_instance_id_param IS NULL OR cs.provider_instance_id = provider_instance_id_param)
    ORDER BY cs.is_default_for_type DESC, cs.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get provider instance from JWT token issuer
CREATE OR REPLACE FUNCTION get_provider_instance_by_issuer(token_issuer_param VARCHAR(255))
RETURNS TABLE (
    system_id UUID,
    system_name VARCHAR(50),
    provider_type VARCHAR(50),
    provider_instance_id VARCHAR(255),
    provider_environment VARCHAR(50),
    provider_region VARCHAR(50),
    provider_domain VARCHAR(255),
    is_default_for_type BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.system_name,
        cs.provider_type,
        cs.provider_instance_id,
        cs.provider_environment,
        cs.provider_region,
        cs.provider_domain,
        cs.is_default_for_type
    FROM ciam_systems cs
    WHERE cs.issuer_url = token_issuer_param 
    AND cs.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to create or update OIDC user mapping
CREATE OR REPLACE FUNCTION upsert_oidc_user_mapping(
    user_id_param UUID, -- Application user ID
    ciam_system_name_param VARCHAR(50), -- CIAM system name (cognito, azure_entra, etc.)
    oidc_sub_param VARCHAR(255), -- OIDC subject identifier
    provider_identifier_param VARCHAR(255), -- Provider-specific identifier
    provider_metadata_param JSONB DEFAULT '{}' -- Provider-specific metadata
)
RETURNS UUID AS $$
DECLARE
    mapping_id UUID; -- Returned mapping ID
    ciam_system_id_val UUID; -- CIAM system ID
BEGIN
    -- Get CIAM system ID from system name
    SELECT id INTO ciam_system_id_val 
    FROM ciam_systems 
    WHERE system_name = ciam_system_name_param AND is_active = TRUE;
    
    IF ciam_system_id_val IS NULL THEN
        RAISE EXCEPTION 'CIAM system not found: %', ciam_system_name_param;
    END IF;
    
    -- Check if mapping already exists
    SELECT id INTO mapping_id
    FROM user_ciam_mappings
    WHERE app_user_id = user_id_param 
    AND ciam_system = ciam_system_name_param
    AND ciam_identifier = oidc_sub_param;
    
    IF mapping_id IS NOT NULL THEN
        -- Update existing mapping with new data
        UPDATE user_ciam_mappings SET
            provider_identifier = provider_identifier_param,
            provider_metadata = provider_metadata_param,
            last_authenticated_at = NOW(),
            updated_at = NOW()
        WHERE id = mapping_id;
    ELSE
        -- Create new mapping
        INSERT INTO user_ciam_mappings (
            app_user_id, ciam_identifier, ciam_system, 
            provider_identifier, provider_metadata, 
            is_current_ciam, last_authenticated_at
        ) VALUES (
            user_id_param, oidc_sub_param, ciam_system_name_param,
            provider_identifier_param, provider_metadata_param,
            TRUE, NOW()
        ) RETURNING id INTO mapping_id;
    END IF;
    
    RETURN mapping_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create or update OIDC user mapping with provider instance
CREATE OR REPLACE FUNCTION upsert_oidc_user_mapping_with_instance(
    user_id_param UUID,
    ciam_system_name_param VARCHAR(50),
    provider_instance_id_param VARCHAR(255),
    oidc_sub_param VARCHAR(255),
    token_issuer_param VARCHAR(255),
    provider_identifier_param VARCHAR(255),
    provider_metadata_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    mapping_id UUID;
    ciam_system_id_val UUID;
BEGIN
    -- Get CIAM system ID from system name and provider instance
    SELECT id INTO ciam_system_id_val 
    FROM ciam_systems 
    WHERE system_name = ciam_system_name_param 
    AND provider_instance_id = provider_instance_id_param
    AND is_active = TRUE;
    
    IF ciam_system_id_val IS NULL THEN
        RAISE EXCEPTION 'CIAM system not found: % with instance: %', ciam_system_name_param, provider_instance_id_param;
    END IF;
    
    -- Check if mapping already exists
    SELECT id INTO mapping_id
    FROM user_ciam_mappings
    WHERE app_user_id = user_id_param 
    AND ciam_system = ciam_system_name_param
    AND provider_instance_id = provider_instance_id_param
    AND ciam_identifier = oidc_sub_param;
    
    IF mapping_id IS NOT NULL THEN
        -- Update existing mapping
        UPDATE user_ciam_mappings SET
            ciam_system_id = ciam_system_id_val,
            provider_identifier = provider_identifier_param,
            provider_metadata = provider_metadata_param,
            token_issuer = token_issuer_param,
            last_authenticated_at = NOW(),
            updated_at = NOW()
        WHERE id = mapping_id;
    ELSE
        -- Create new mapping
        INSERT INTO user_ciam_mappings (
            app_user_id, ciam_identifier, ciam_system, ciam_system_id,
            provider_identifier, provider_metadata, token_issuer,
            provider_instance_id, provider_environment,
            is_current_ciam, last_authenticated_at
        ) VALUES (
            user_id_param, oidc_sub_param, ciam_system_name_param, ciam_system_id_val,
            provider_identifier_param, provider_metadata_param, token_issuer_param,
            provider_instance_id_param, 
            (SELECT provider_environment FROM ciam_systems WHERE id = ciam_system_id_val),
            TRUE, NOW()
        ) RETURNING id INTO mapping_id;
    END IF;
    
    RETURN mapping_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get the current OIDC provider for a user
CREATE OR REPLACE FUNCTION get_user_current_oidc_provider(user_id_param UUID)
RETURNS TABLE (
    ciam_system_name VARCHAR(50),
    ciam_identifier VARCHAR(255),
    provider_metadata JSONB,
    last_authenticated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ucm.ciam_system,
        ucm.ciam_identifier,
        ucm.provider_metadata,
        ucm.last_authenticated_at
    FROM user_ciam_mappings ucm
    WHERE ucm.app_user_id = user_id_param 
    AND ucm.is_current_ciam = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get OIDC claims for a user from their current provider
CREATE OR REPLACE FUNCTION get_user_oidc_claims(user_id_param UUID)
RETURNS TABLE (
    oidc_sub VARCHAR(255),
    oidc_issuer VARCHAR(255),
    oidc_audience VARCHAR(255),
    email VARCHAR(255),
    email_verified BOOLEAN,
    phone_number VARCHAR(50),
    phone_number_verified BOOLEAN,
    given_name VARCHAR(255),
    family_name VARCHAR(255),
    name VARCHAR(255),
    preferred_username VARCHAR(255),
    locale VARCHAR(10),
    timezone VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.oidc_sub,
        u.oidc_issuer,
        u.oidc_audience,
        u.email,
        u.email_verified,
        u.phone_number,
        u.phone_number_verified,
        u.given_name,
        u.family_name,
        u.name,
        u.preferred_username,
        u.locale,
        u.timezone
    FROM users u
    WHERE u.id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CONSTRAINTS FOR DATA INTEGRITY
-- =============================================================================

-- Ensure ciam_identifier is not empty
ALTER TABLE user_ciam_mappings ADD CONSTRAINT user_ciam_mappings_ciam_identifier_not_empty 
    CHECK (ciam_identifier IS NOT NULL AND ciam_identifier != '');

-- Ensure provider_identifier is not empty when provided
ALTER TABLE user_ciam_mappings ADD CONSTRAINT user_ciam_mappings_provider_identifier_not_empty 
    CHECK (provider_identifier IS NULL OR provider_identifier != '');

-- Ensure ciam_system is not empty
ALTER TABLE user_ciam_mappings ADD CONSTRAINT user_ciam_mappings_ciam_system_not_empty 
    CHECK (ciam_system IS NOT NULL AND ciam_system != '');

-- Ensure provider_instance_id is not empty
ALTER TABLE ciam_systems ADD CONSTRAINT ciam_systems_provider_instance_id_not_empty 
    CHECK (provider_instance_id IS NOT NULL AND provider_instance_id != '');

-- Ensure provider_environment is valid
ALTER TABLE ciam_systems ADD CONSTRAINT ciam_systems_provider_environment_valid 
    CHECK (provider_environment IN ('production', 'staging', 'development', 'test', 'local'));

-- Ensure provider_instance_id is not empty in user_ciam_mappings
ALTER TABLE user_ciam_mappings ADD CONSTRAINT user_ciam_mappings_provider_instance_id_not_empty 
    CHECK (provider_instance_id IS NULL OR provider_instance_id != '');

-- Ensure token_issuer is not empty when provided
ALTER TABLE user_ciam_mappings ADD CONSTRAINT user_ciam_mappings_token_issuer_not_empty 
    CHECK (token_issuer IS NULL OR token_issuer != '');

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default customer and site
DO $$
DECLARE
    default_customer_id UUID;
    default_site_id UUID;
BEGIN
    -- Insert default customer
    INSERT INTO customers (name, email, status, subscription_plan, max_sites, max_storage_gb, max_bandwidth_gb)
    VALUES (
        'Default Customer',
        'default@agoat-publisher.com',
        'active',
        'basic',
        10,
        100,
        1000
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO default_customer_id;

    -- Get the customer ID if it already exists
    IF default_customer_id IS NULL THEN
        SELECT id INTO default_customer_id FROM customers WHERE email = 'default@agoat-publisher.com';
    END IF;

    -- Insert default site
    INSERT INTO sites (customer_id, name, slug, status, template)
    VALUES (default_customer_id, 'Default Site', 'default', 'active', 'default')
    ON CONFLICT (customer_id, slug) DO NOTHING
    RETURNING id INTO default_site_id;

    -- Get the site ID if it already exists
    IF default_site_id IS NULL THEN
        SELECT id INTO default_site_id FROM sites WHERE customer_id = default_customer_id AND slug = 'default';
    END IF;
END $$;

-- Insert default CIAM systems with provider instance information
INSERT INTO ciam_systems (system_name, display_name, provider_type, is_active, provider_instance_id, provider_environment, provider_region, provider_domain, jwks_url, issuer_url, oidc_discovery_url, authorization_endpoint, token_endpoint, userinfo_endpoint, end_session_endpoint, client_id, scopes, response_type, response_mode, code_challenge_method, supported_claims, provider_metadata, is_default_for_type) VALUES
('cognito', 'AWS Cognito Dev', 'oidc', TRUE, 'us-east-1_FJUcN8W07', 'development', 'us-east-1', 'auth.dev.np-topvitaminsupply.com',
 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/jwks.json',
 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07',
 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/openid_configuration',
 'https://auth.dev.np-topvitaminsupply.com/login/continue',
 'https://auth.dev.np-topvitaminsupply.com/oauth2/token',
 'https://auth.dev.np-topvitaminsupply.com/oauth2/userInfo',
 'https://auth.dev.np-topvitaminsupply.com/logout',
 '4lt0iqap612c9jug55f3a1s69k',
 'email openid phone',
 'code',
 'query',
 'S256',
 '{"sub": "string", "email": "string", "email_verified": "boolean", "phone_number": "string", "phone_number_verified": "boolean", "given_name": "string", "family_name": "string", "name": "string", "preferred_username": "string", "cognito:username": "string"}',
 '{"user_pool_id": "us-east-1_FJUcN8W07", "region": "us-east-1", "domain": "auth.dev.np-topvitaminsupply.com"}',
 TRUE)
ON CONFLICT (system_name, provider_instance_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    provider_type = EXCLUDED.provider_type,
    is_active = EXCLUDED.is_active,
    provider_environment = EXCLUDED.provider_environment,
    provider_region = EXCLUDED.provider_region,
    provider_domain = EXCLUDED.provider_domain,
    jwks_url = EXCLUDED.jwks_url,
    issuer_url = EXCLUDED.issuer_url,
    oidc_discovery_url = EXCLUDED.oidc_discovery_url,
    authorization_endpoint = EXCLUDED.authorization_endpoint,
    token_endpoint = EXCLUDED.token_endpoint,
    userinfo_endpoint = EXCLUDED.userinfo_endpoint,
    end_session_endpoint = EXCLUDED.end_session_endpoint,
    client_id = EXCLUDED.client_id,
    scopes = EXCLUDED.scopes,
    response_type = EXCLUDED.response_type,
    response_mode = EXCLUDED.response_mode,
    code_challenge_method = EXCLUDED.code_challenge_method,
    supported_claims = EXCLUDED.supported_claims,
    provider_metadata = EXCLUDED.provider_metadata,
    is_default_for_type = EXCLUDED.is_default_for_type,
    updated_at = NOW();

INSERT INTO ciam_systems (system_name, display_name, provider_type, is_active, provider_instance_id, provider_environment, provider_region, provider_domain, jwks_url, issuer_url, oidc_discovery_url, authorization_endpoint, token_endpoint, userinfo_endpoint, end_session_endpoint, client_id, scopes, response_type, response_mode, code_challenge_method, supported_claims, provider_metadata, is_default_for_type) VALUES
('azure_entra', 'Microsoft Azure Entra ID', 'oidc', TRUE, 'placeholder-tenant-id', 'development', 'global', 'login.microsoftonline.com',
 'https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys',
 'https://login.microsoftonline.com/{tenant_id}/v2.0',
 'https://login.microsoftonline.com/{tenant_id}/.well-known/openid_configuration',
 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize',
 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token',
 'https://graph.microsoft.com/oidc/userinfo',
 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/logout',
 'placeholder',
 'openid profile email',
 'code',
 'query',
 'S256',
 '{"sub": "string", "email": "string", "email_verified": "boolean", "given_name": "string", "family_name": "string", "name": "string", "preferred_username": "string", "oid": "string", "tid": "string"}',
 '{"tenant_id": "placeholder", "authority_url": "https://login.microsoftonline.com/{tenant_id}"}',
 TRUE)
ON CONFLICT (system_name, provider_instance_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    provider_type = EXCLUDED.provider_type,
    is_active = EXCLUDED.is_active,
    provider_environment = EXCLUDED.provider_environment,
    provider_region = EXCLUDED.provider_region,
    provider_domain = EXCLUDED.provider_domain,
    jwks_url = EXCLUDED.jwks_url,
    issuer_url = EXCLUDED.issuer_url,
    oidc_discovery_url = EXCLUDED.oidc_discovery_url,
    authorization_endpoint = EXCLUDED.authorization_endpoint,
    token_endpoint = EXCLUDED.token_endpoint,
    userinfo_endpoint = EXCLUDED.userinfo_endpoint,
    end_session_endpoint = EXCLUDED.end_session_endpoint,
    client_id = EXCLUDED.client_id,
    scopes = EXCLUDED.scopes,
    response_type = EXCLUDED.response_type,
    response_mode = EXCLUDED.response_mode,
    code_challenge_method = EXCLUDED.code_challenge_method,
    supported_claims = EXCLUDED.supported_claims,
    provider_metadata = EXCLUDED.provider_metadata,
    is_default_for_type = EXCLUDED.is_default_for_type,
    updated_at = NOW();

-- =============================================================================
-- COMMENTS
-- =============================================================================

-- Table Comments - High-level descriptions of table purposes
COMMENT ON TABLE customers IS 'Customer accounts for multitenant architecture';
COMMENT ON TABLE sites IS 'Sites belonging to customers';
COMMENT ON TABLE users IS 'User accounts with OIDC-compliant authentication support only';
COMMENT ON TABLE posts IS 'Content posts with tenant context';
COMMENT ON TABLE ciam_systems IS 'OIDC-compliant CIAM system configurations supporting multiple instances of the same provider type';
COMMENT ON TABLE user_ciam_mappings IS 'OIDC provider-agnostic user identity mappings - all provider-specific data stored in provider_metadata JSONB field';
COMMENT ON TABLE oidc_tokens IS 'Secure storage for OIDC tokens with metadata';
COMMENT ON TABLE oidc_sessions IS 'OIDC session management with state and PKCE support';

-- Column Comments - Detailed descriptions of field purposes and data sources
COMMENT ON COLUMN users.auth_method IS 'Authentication method - only local or oidc allowed';
COMMENT ON COLUMN users.provider_metadata IS 'Provider-specific user data stored as JSONB - no provider-specific columns';

COMMENT ON COLUMN ciam_systems.provider_type IS 'OIDC provider type (oidc, oauth2, saml, custom)';
COMMENT ON COLUMN ciam_systems.provider_instance_id IS 'Unique identifier for specific provider instance/environment/pool - obtained from JWT token iss claim';
COMMENT ON COLUMN ciam_systems.provider_environment IS 'Provider environment context (production, staging, development, test, local)';
COMMENT ON COLUMN ciam_systems.provider_region IS 'Provider region information (us-east-1, us-west-2, europe-west-1, global)';
COMMENT ON COLUMN ciam_systems.provider_domain IS 'Provider domain from JWT token iss claim or configuration';
COMMENT ON COLUMN ciam_systems.is_default_for_type IS 'Indicates if this is the default provider for this provider_type';
COMMENT ON COLUMN ciam_systems.oidc_discovery_url IS 'OIDC discovery endpoint URL';
COMMENT ON COLUMN ciam_systems.supported_claims IS 'JSON schema of supported OIDC claims';
COMMENT ON COLUMN ciam_systems.provider_metadata IS 'Provider-specific configuration and metadata';

COMMENT ON COLUMN user_ciam_mappings.ciam_system_id IS 'Direct reference to specific CIAM system instance';
COMMENT ON COLUMN user_ciam_mappings.provider_instance_id IS 'Provider instance identifier for quick lookup - same as ciam_systems.provider_instance_id';
COMMENT ON COLUMN user_ciam_mappings.provider_environment IS 'Provider environment for audit and debugging';
COMMENT ON COLUMN user_ciam_mappings.token_issuer IS 'JWT token issuer URL for validation - obtained from JWT token iss claim';
COMMENT ON COLUMN user_ciam_mappings.provider_identifier IS 'Generic provider identifier - specific data in provider_metadata';
COMMENT ON COLUMN user_ciam_mappings.provider_metadata IS 'All provider-specific data stored here - no provider-specific columns';
COMMENT ON COLUMN user_ciam_mappings.last_authenticated_at IS 'Last successful authentication timestamp';

COMMENT ON COLUMN oidc_tokens.token_hash IS 'Hashed token for security (never store plain tokens)';
COMMENT ON COLUMN oidc_tokens.token_metadata IS 'Token claims, expiry, and other metadata';
COMMENT ON COLUMN oidc_tokens.token_issuer IS 'JWT token issuer URL for validation - obtained from JWT token iss claim';
COMMENT ON COLUMN oidc_tokens.provider_instance_id IS 'Provider instance identifier for quick lookup';
COMMENT ON COLUMN oidc_tokens.token_audience IS 'JWT token audience for validation - obtained from JWT token aud claim';

COMMENT ON COLUMN oidc_sessions.state IS 'OAuth2 state parameter for CSRF protection';
COMMENT ON COLUMN oidc_sessions.code_verifier IS 'PKCE code verifier for enhanced security';
COMMENT ON COLUMN oidc_sessions.return_url IS 'URL to redirect to after authentication';
COMMENT ON COLUMN oidc_sessions.provider_instance_id IS 'Provider instance identifier for quick lookup';
COMMENT ON COLUMN oidc_sessions.provider_environment IS 'Provider environment for audit and debugging';

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- =============================================================================
-- CONTENT MANAGEMENT TABLES
-- =============================================================================

-- Site-specific pages (replaces hardcoded Thorne pages)
-- Purpose: Dynamic pages within sites for flexible content management
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (content table, not user table)
-- App Client Identifier: None (content table, not client table)
CREATE TABLE site_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for page identification
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that contains this page
    name VARCHAR(255) NOT NULL, -- Page display name
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier for page
    title VARCHAR(255) NOT NULL, -- Page title (for SEO and display)
    description TEXT, -- Page description (for SEO and display)
    content_type VARCHAR(50) NOT NULL DEFAULT 'page' CHECK (content_type IN ('page', 'component', 'template')), -- Type of content
    template VARCHAR(100) DEFAULT 'default', -- Template used for rendering this page
    content JSONB NOT NULL DEFAULT '{}', -- Page content (structured data, HTML, etc.)
    metadata JSONB NOT NULL DEFAULT '{}', -- Additional page metadata (SEO, custom fields, etc.)
    is_active BOOLEAN DEFAULT true, -- Whether page is active and can be accessed
    is_public BOOLEAN DEFAULT true, -- Whether page is publicly accessible
    sort_order INTEGER DEFAULT 0, -- Order for displaying pages in lists
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(site_id, slug) -- Unique constraint: one page per slug per site
);

-- Site-specific components (reusable UI components)
-- Purpose: Reusable UI components within sites for flexible content management
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (content table, not user table)
-- App Client Identifier: None (content table, not client table)
CREATE TABLE site_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for component identification
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that contains this component
    name VARCHAR(255) NOT NULL, -- Component name
    component_type VARCHAR(100) NOT NULL, -- 'product-grid', 'category-list', 'registration-form', etc.
    title VARCHAR(255), -- Component title
    description TEXT, -- Component description
    configuration JSONB NOT NULL DEFAULT '{}', -- Component configuration settings
    content JSONB NOT NULL DEFAULT '{}', -- Component content data
    metadata JSONB NOT NULL DEFAULT '{}', -- Additional component metadata
    is_active BOOLEAN DEFAULT true, -- Whether component is active and can be used
    sort_order INTEGER DEFAULT 0, -- Order for displaying components in lists
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(site_id, name) -- Unique constraint: one component per name per site
);

-- Site-specific data collections (products, categories, etc.)
-- Purpose: Defines data collection schemas within sites for flexible content management
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (content table, not user table)
-- App Client Identifier: None (content table, not client table)
CREATE TABLE site_data_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for collection identification
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that contains this collection
    name VARCHAR(255) NOT NULL, -- Collection name
    collection_type VARCHAR(100) NOT NULL, -- 'products', 'categories', 'patients', 'orders', etc.
    title VARCHAR(255) NOT NULL, -- Collection title
    description TEXT, -- Collection description
    schema JSONB NOT NULL DEFAULT '{}', -- JSON schema for validation of data items
    metadata JSONB NOT NULL DEFAULT '{}', -- Additional collection metadata
    is_active BOOLEAN DEFAULT true, -- Whether collection is active and can be used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(site_id, name) -- Unique constraint: one collection per name per site
);

-- Site-specific data items (actual data for collections)
-- Purpose: Individual data items within collections for flexible content management
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (content table, not user table)
-- App Client Identifier: None (content table, not client table)
CREATE TABLE site_data_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for data item identification
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that contains this data item
    collection_id UUID NOT NULL REFERENCES site_data_collections(id) ON DELETE CASCADE, -- References collection this item belongs to
    name VARCHAR(255) NOT NULL, -- Data item name
    title VARCHAR(255) NOT NULL, -- Data item title
    slug VARCHAR(255), -- URL-friendly identifier for data item
    data JSONB NOT NULL DEFAULT '{}', -- Actual data content (validated against collection schema)
    metadata JSONB NOT NULL DEFAULT '{}', -- Additional data item metadata
    is_active BOOLEAN DEFAULT true, -- Whether data item is active and can be accessed
    sort_order INTEGER DEFAULT 0, -- Order for displaying data items in lists
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(site_id, collection_id, slug) -- Unique constraint: one item per slug per collection per site
);

-- Site-specific navigation menus
-- Purpose: Navigation menus within sites for flexible content management
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (content table, not user table)
-- App Client Identifier: None (content table, not client table)
CREATE TABLE site_navigation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for navigation identification
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that contains this navigation
    name VARCHAR(255) NOT NULL, -- Navigation name
    menu_type VARCHAR(50) NOT NULL DEFAULT 'main' CHECK (menu_type IN ('main', 'footer', 'sidebar', 'mobile')), -- Type of navigation menu
    title VARCHAR(255) NOT NULL, -- Navigation title
    items JSONB NOT NULL DEFAULT '[]', -- Array of menu items with links, labels, etc.
    is_active BOOLEAN DEFAULT true, -- Whether navigation is active and can be used
    sort_order INTEGER DEFAULT 0, -- Order for displaying navigation in lists
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(site_id, name) -- Unique constraint: one navigation per name per site
);

-- Site-specific settings (replaces hardcoded Thorne settings)
-- Purpose: Site-specific configuration settings for flexible content management
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (content table, not user table)
-- App Client Identifier: None (content table, not client table)
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for setting identification
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that contains this setting
    category VARCHAR(100) NOT NULL, -- 'general', 'appearance', 'business', 'compliance', etc.
    key VARCHAR(255) NOT NULL, -- Setting key/name
    value JSONB NOT NULL DEFAULT '{}', -- Setting value (can be any JSON type)
    data_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')), -- Type of setting value
    description TEXT, -- Setting description
    is_public BOOLEAN DEFAULT false, -- Whether this setting can be accessed by frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(site_id, category, key) -- Unique constraint: one setting per key per category per site
);

-- Site-specific API endpoints configuration
-- Purpose: Dynamic API endpoint configuration within sites for flexible content management
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (content table, not user table)
-- App Client Identifier: None (content table, not client table)
CREATE TABLE site_api_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for endpoint identification
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that contains this endpoint
    name VARCHAR(255) NOT NULL, -- Endpoint name
    path VARCHAR(500) NOT NULL, -- API endpoint path
    method VARCHAR(10) NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')), -- HTTP method
    handler_type VARCHAR(100) NOT NULL, -- 'data_collection', 'custom', 'static', etc.
    configuration JSONB NOT NULL DEFAULT '{}', -- Endpoint configuration settings
    is_active BOOLEAN DEFAULT true, -- Whether endpoint is active and can be accessed
    requires_auth BOOLEAN DEFAULT false, -- Whether endpoint requires authentication
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(site_id, path, method) -- Unique constraint: one endpoint per path per method per site
);

-- Hostname to site mapping for multi-tenant hosting
-- Purpose: Maps hostnames to sites for multi-tenant hosting
-- Cross-database ready: Will remain in tenant database
-- User Pool Identifier: None (hostname mapping table)
-- App Client Identifier: None (hostname mapping table)
CREATE TABLE site_hostname_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for hostname mapping identification
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE, -- References site that this hostname maps to
    hostname VARCHAR(255) NOT NULL, -- Hostname (e.g., 'example.com', 'dev.example.com')
    is_primary BOOLEAN DEFAULT false, -- Whether this is the primary hostname for the site
    is_active BOOLEAN DEFAULT true, -- Whether this hostname mapping is active
    ssl_enabled BOOLEAN DEFAULT true, -- Whether SSL/TLS is enabled for this hostname
    redirect_to_https BOOLEAN DEFAULT true, -- Whether HTTP requests should be redirected to HTTPS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(hostname) -- Unique constraint: one mapping per hostname
);

-- =============================================================================
-- PLATFORM INDEXES
-- =============================================================================

-- Platform users indexes
CREATE INDEX idx_platform_users_email ON platform_users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_username ON platform_users (username) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_active ON platform_users (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_last_login ON platform_users (last_login_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_employee_id ON platform_users (employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_department ON platform_users (department) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_is_superadmin ON platform_users (is_superadmin) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_manager_user_id ON platform_users (manager_user_id) WHERE deleted_at IS NULL;

-- Platform CIAM systems indexes
CREATE INDEX idx_platform_ciam_systems_type ON platform_ciam_systems (provider_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_ciam_systems_instance ON platform_ciam_systems (provider_instance_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_ciam_systems_active ON platform_ciam_systems (is_active) WHERE deleted_at IS NULL;

-- Platform user CIAM mappings indexes
CREATE INDEX idx_platform_user_ciam_mappings_user_id ON platform_user_ciam_mappings (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_user_ciam_mappings_ciam_system_id ON platform_user_ciam_mappings (ciam_system_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_user_ciam_mappings_provider_user_id ON platform_user_ciam_mappings (provider_user_id) WHERE deleted_at IS NULL;

-- Platform OIDC tokens indexes
CREATE INDEX idx_platform_oidc_tokens_user_id ON platform_oidc_tokens (user_id);
CREATE INDEX idx_platform_oidc_tokens_expires_at ON platform_oidc_tokens (expires_at);
CREATE INDEX idx_platform_oidc_tokens_revoked ON platform_oidc_tokens (is_revoked);

-- Platform OIDC sessions indexes
CREATE INDEX idx_platform_oidc_sessions_user_id ON platform_oidc_sessions (user_id);
CREATE INDEX idx_platform_oidc_sessions_token ON platform_oidc_sessions (session_token);
CREATE INDEX idx_platform_oidc_sessions_active ON platform_oidc_sessions (is_active, expires_at);

-- Platform tenant databases indexes
CREATE INDEX idx_platform_tenant_databases_tenant_id ON platform_tenant_databases (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_databases_tenant_slug ON platform_tenant_databases (tenant_slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_databases_active ON platform_tenant_databases (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_databases_type ON platform_tenant_databases (database_type) WHERE deleted_at IS NULL;

-- Platform keyvault secrets indexes
CREATE INDEX idx_platform_keyvault_secrets_name ON platform_keyvault_secrets (secret_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_keyvault_secrets_type ON platform_keyvault_secrets (secret_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_keyvault_secrets_active ON platform_keyvault_secrets (is_active) WHERE deleted_at IS NULL;

-- Platform tenant access indexes
CREATE INDEX idx_platform_tenant_access_user_id ON platform_tenant_access (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_access_tenant_id ON platform_tenant_access (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_access_role ON platform_tenant_access (role) WHERE deleted_at IS NULL;

-- Platform provider permissions indexes
CREATE INDEX idx_platform_provider_permissions_user_id ON platform_provider_permissions (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_provider_permissions_type ON platform_provider_permissions (permission_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_provider_permissions_active ON platform_provider_permissions (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_provider_permissions_expires ON platform_provider_permissions (expires_at) WHERE deleted_at IS NULL;

-- Platform tenant permissions indexes
CREATE INDEX idx_platform_tenant_permissions_user_id ON platform_tenant_permissions (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_permissions_tenant_id ON platform_tenant_permissions (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_permissions_tenant_slug ON platform_tenant_permissions (tenant_slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_permissions_type ON platform_tenant_permissions (permission_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_permissions_active ON platform_tenant_permissions (is_active) WHERE deleted_at IS NULL;

-- Platform site permissions indexes
CREATE INDEX idx_platform_site_permissions_user_id ON platform_site_permissions (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_site_permissions_site_id ON platform_site_permissions (site_id) WHERE deleted_at IS NULL;

-- Platform roles indexes
CREATE INDEX idx_platform_roles_name ON platform_roles (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_roles_active ON platform_roles (is_active) WHERE deleted_at IS NULL;

-- Platform user roles indexes
CREATE INDEX idx_platform_user_roles_user_id ON platform_user_roles (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_user_roles_role_id ON platform_user_roles (role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_user_roles_active ON platform_user_roles (is_active) WHERE deleted_at IS NULL;

-- Platform permissions indexes
CREATE INDEX idx_platform_permissions_name ON platform_permissions (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_permissions_resource_type ON platform_permissions (resource_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_permissions_action ON platform_permissions (action) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_permissions_active ON platform_permissions (is_active) WHERE deleted_at IS NULL;

-- User emulation indexes
CREATE INDEX idx_platform_user_emulations_emulator_user_id ON platform_user_emulations (emulator_user_id);
CREATE INDEX idx_platform_user_emulations_emulated_user_id ON platform_user_emulations (emulated_user_id);
CREATE INDEX idx_platform_user_emulations_emulated_site_id ON platform_user_emulations (emulated_site_id);
CREATE INDEX idx_platform_user_emulations_token ON platform_user_emulations (emulation_token);
CREATE INDEX idx_platform_user_emulations_active ON platform_user_emulations (is_active, started_at);
CREATE INDEX idx_platform_site_permissions_tenant_id ON platform_site_permissions (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_site_permissions_type ON platform_site_permissions (permission_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_site_permissions_active ON platform_site_permissions (is_active) WHERE deleted_at IS NULL;

-- Platform hierarchical sessions indexes
CREATE INDEX idx_platform_hierarchical_sessions_user_id ON platform_hierarchical_sessions (user_id);
CREATE INDEX idx_platform_hierarchical_sessions_token ON platform_hierarchical_sessions (session_token);
CREATE INDEX idx_platform_hierarchical_sessions_tenant_token ON platform_hierarchical_sessions (tenant_token);
CREATE INDEX idx_platform_hierarchical_sessions_type ON platform_hierarchical_sessions (session_type);
CREATE INDEX idx_platform_hierarchical_sessions_active ON platform_hierarchical_sessions (is_active, expires_at);
CREATE INDEX idx_platform_hierarchical_sessions_parent ON platform_hierarchical_sessions (parent_session_id);

-- Platform permission inheritance indexes
CREATE INDEX idx_platform_permission_inheritance_parent ON platform_permission_inheritance (parent_permission_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_permission_inheritance_child ON platform_permission_inheritance (child_permission_type) WHERE deleted_at IS NULL;

-- =============================================================================
-- CONTENT MANAGEMENT INDEXES
-- =============================================================================

-- Site pages indexes
CREATE INDEX idx_site_pages_site_id ON site_pages (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_pages_slug ON site_pages (site_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_pages_content_type ON site_pages (site_id, content_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_pages_active ON site_pages (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_site_pages_public ON site_pages (site_id, is_public) WHERE is_public = true AND deleted_at IS NULL;

-- Site components indexes
CREATE INDEX idx_site_components_site_id ON site_components (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_components_type ON site_components (site_id, component_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_components_active ON site_components (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Site data collections indexes
CREATE INDEX idx_site_data_collections_site_id ON site_data_collections (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_collections_type ON site_data_collections (site_id, collection_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_collections_active ON site_data_collections (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Site data items indexes
CREATE INDEX idx_site_data_items_site_id ON site_data_items (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_items_collection_id ON site_data_items (collection_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_items_slug ON site_data_items (site_id, collection_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_items_active ON site_data_items (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Site navigation indexes
CREATE INDEX idx_site_navigation_site_id ON site_navigation (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_navigation_type ON site_navigation (site_id, menu_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_navigation_active ON site_navigation (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Site settings indexes
CREATE INDEX idx_site_settings_site_id ON site_settings (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_settings_category ON site_settings (site_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_settings_public ON site_settings (site_id, is_public) WHERE is_public = true AND deleted_at IS NULL;

-- Site API endpoints indexes
CREATE INDEX idx_site_api_endpoints_site_id ON site_api_endpoints (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_api_endpoints_path ON site_api_endpoints (site_id, path) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_api_endpoints_active ON site_api_endpoints (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Hostname mapping indexes
CREATE INDEX idx_site_hostname_mappings_site_id ON site_hostname_mappings (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_hostname_mappings_hostname ON site_hostname_mappings (hostname) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_hostname_mappings_active ON site_hostname_mappings (is_active) WHERE deleted_at IS NULL;

-- =============================================================================
-- CONTENT MANAGEMENT TRIGGERS
-- =============================================================================

CREATE TRIGGER trigger_update_site_pages_updated_at
    BEFORE UPDATE ON site_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_components_updated_at
    BEFORE UPDATE ON site_components
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_data_collections_updated_at
    BEFORE UPDATE ON site_data_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_data_items_updated_at
    BEFORE UPDATE ON site_data_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_navigation_updated_at
    BEFORE UPDATE ON site_navigation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_api_endpoints_updated_at
    BEFORE UPDATE ON site_api_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CONTENT MANAGEMENT FUNCTIONS
-- =============================================================================

-- Function to get site page by slug
CREATE OR REPLACE FUNCTION get_site_page(site_id_param UUID, slug_param VARCHAR(255))
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    slug VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    content_type VARCHAR(50),
    template VARCHAR(100),
    content JSONB,
    metadata JSONB,
    is_active BOOLEAN,
    is_public BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.title,
        sp.description,
        sp.content_type,
        sp.template,
        sp.content,
        sp.metadata,
        sp.is_active,
        sp.is_public
    FROM site_pages sp
    WHERE sp.site_id = site_id_param 
    AND sp.slug = slug_param
    AND sp.is_active = true
    AND sp.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get site components by type
CREATE OR REPLACE FUNCTION get_site_components_by_type(site_id_param UUID, component_type_param VARCHAR(100))
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    component_type VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    configuration JSONB,
    content JSONB,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.name,
        sc.component_type,
        sc.title,
        sc.description,
        sc.configuration,
        sc.content,
        sc.metadata
    FROM site_components sc
    WHERE sc.site_id = site_id_param 
    AND sc.component_type = component_type_param
    AND sc.is_active = true
    AND sc.deleted_at IS NULL
    ORDER BY sc.sort_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get site data items by collection
CREATE OR REPLACE FUNCTION get_site_data_items_by_collection(site_id_param UUID, collection_name_param VARCHAR(255))
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    title VARCHAR(255),
    slug VARCHAR(255),
    data JSONB,
    metadata JSONB,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sdi.id,
        sdi.name,
        sdi.title,
        sdi.slug,
        sdi.data,
        sdi.metadata,
        sdi.sort_order
    FROM site_data_items sdi
    JOIN site_data_collections sdc ON sdi.collection_id = sdc.id
    WHERE sdi.site_id = site_id_param 
    AND sdc.name = collection_name_param
    AND sdi.is_active = true
    AND sdi.deleted_at IS NULL
    AND sdc.deleted_at IS NULL
    ORDER BY sdi.sort_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get site setting value
CREATE OR REPLACE FUNCTION get_site_setting(site_id_param UUID, category_param VARCHAR(100), key_param VARCHAR(255))
RETURNS JSONB AS $$
DECLARE
    setting_value JSONB;
BEGIN
    SELECT value INTO setting_value
    FROM site_settings
    WHERE site_id = site_id_param 
    AND category = category_param
    AND key = key_param
    AND deleted_at IS NULL;
    
    RETURN COALESCE(setting_value, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to get public site settings
CREATE OR REPLACE FUNCTION get_public_site_settings(site_id_param UUID)
RETURNS TABLE (
    category VARCHAR(100),
    key VARCHAR(255),
    value JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.category,
        ss.key,
        ss.value
    FROM site_settings ss
    WHERE ss.site_id = site_id_param 
    AND ss.is_public = true
    AND ss.deleted_at IS NULL
    ORDER BY ss.category, ss.key;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- HOSTNAME MAPPING FUNCTIONS
-- =============================================================================

-- Function to get site_id by hostname
CREATE OR REPLACE FUNCTION get_site_id_by_hostname(hostname_param VARCHAR(255))
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    site_id_result UUID;
BEGIN
    SELECT site_id INTO site_id_result
    FROM site_hostname_mappings
    WHERE hostname = hostname_param
    AND is_active = true
    AND deleted_at IS NULL;
    
    RETURN site_id_result;
END $$;

-- Function to get all hostnames for a site
CREATE OR REPLACE FUNCTION get_hostnames_by_site_id(site_id_param UUID)
RETURNS TABLE(hostname VARCHAR(255), is_primary BOOLEAN, is_active BOOLEAN)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT shm.hostname, shm.is_primary, shm.is_active
    FROM site_hostname_mappings shm
    WHERE shm.site_id = site_id_param
    AND shm.deleted_at IS NULL
    ORDER BY shm.is_primary DESC, shm.created_at ASC;
END $$;

-- =============================================================================
-- PLATFORM PERMISSION FUNCTIONS
-- =============================================================================

-- Function to check provider organization permissions
CREATE OR REPLACE FUNCTION check_provider_permissions(user_id_param UUID, permission_type_param VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    has_permission BOOLEAN := false;
    user_pool_type VARCHAR(50);
BEGIN
    -- Get user pool type
    SELECT pool_type INTO user_pool_type
    FROM platform_users
    WHERE id = user_id_param AND deleted_at IS NULL;
    
    -- Only employee pool users can have provider permissions
    IF user_pool_type != 'employee' THEN
        RETURN false;
    END IF;
    
    -- Check if user has provider permissions
    SELECT EXISTS(
        SELECT 1 FROM platform_provider_permissions
        WHERE user_id = user_id_param
        AND permission_type = permission_type_param
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND deleted_at IS NULL
    ) INTO has_permission;
    
    RETURN has_permission;
END $$;

-- Function to check tenant permissions
CREATE OR REPLACE FUNCTION check_tenant_permissions(user_id_param UUID, tenant_id_param UUID, permission_type_param VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    has_permission BOOLEAN := false;
    user_pool_type VARCHAR(50);
    tenant_owner_type VARCHAR(50);
BEGIN
    -- Get user pool type
    SELECT pool_type INTO user_pool_type
    FROM platform_users
    WHERE id = user_id_param AND deleted_at IS NULL;
    
    -- Get tenant owner type
    SELECT tenant_owner_type INTO tenant_owner_type
    FROM customers
    WHERE id = tenant_id_param AND deleted_at IS NULL;
    
    -- Employee pool users with provider permissions can access any tenant
    IF user_pool_type = 'employee' AND check_provider_permissions(user_id_param, 'full_access') THEN
        RETURN true;
    END IF;
    
    -- Customer pool users can only access customer-owned tenants
    IF user_pool_type = 'customer' AND tenant_owner_type != 'customer' THEN
        RETURN false;
    END IF;
    
    -- Check specific tenant permissions
    SELECT EXISTS(
        SELECT 1 FROM platform_tenant_permissions
        WHERE user_id = user_id_param
        AND tenant_id = tenant_id_param
        AND permission_type = permission_type_param
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND deleted_at IS NULL
    ) INTO has_permission;
    
    RETURN has_permission;
END $$;

-- Function to check site permissions
CREATE OR REPLACE FUNCTION check_site_permissions(user_id_param UUID, site_id_param UUID, permission_type_param VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    has_permission BOOLEAN := false;
    user_pool_type VARCHAR(50);
    site_tenant_id UUID;
BEGIN
    -- Get user pool type
    SELECT pool_type INTO user_pool_type
    FROM platform_users
    WHERE id = user_id_param AND deleted_at IS NULL;
    
    -- Get site tenant ID
    SELECT customer_id INTO site_tenant_id
    FROM sites
    WHERE id = site_id_param AND deleted_at IS NULL;
    
    -- Employee pool users with provider permissions can access any site
    IF user_pool_type = 'employee' AND check_provider_permissions(user_id_param, 'full_access') THEN
        RETURN true;
    END IF;
    
    -- Check if user has tenant permissions for the site's tenant
    IF check_tenant_permissions(user_id_param, site_tenant_id, 'owner') THEN
        RETURN true;
    END IF;
    
    -- Check specific site permissions
    SELECT EXISTS(
        SELECT 1 FROM platform_site_permissions
        WHERE user_id = user_id_param
        AND site_id = site_id_param
        AND permission_type = permission_type_param
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND deleted_at IS NULL
    ) INTO has_permission;
    
    RETURN has_permission;
END $$;

-- Function to get user's accessible tenants
CREATE OR REPLACE FUNCTION get_user_accessible_tenants(user_id_param UUID)
RETURNS TABLE(tenant_id UUID, tenant_slug VARCHAR(255), permission_type VARCHAR(50))
LANGUAGE plpgsql
AS $$
BEGIN
    -- Employee pool users with provider permissions can access all tenants
    IF check_provider_permissions(user_id_param, 'full_access') THEN
        RETURN QUERY
        SELECT c.id, c.slug, 'provider'::VARCHAR(50)
        FROM customers c
        WHERE c.deleted_at IS NULL;
    ELSE
        -- Return tenants where user has specific permissions
        RETURN QUERY
        SELECT tp.tenant_id, tp.tenant_slug, tp.permission_type
        FROM platform_tenant_permissions tp
        WHERE tp.user_id = user_id_param
        AND tp.is_active = true
        AND (tp.expires_at IS NULL OR tp.expires_at > NOW())
        AND tp.deleted_at IS NULL;
    END IF;
END $$;

-- Function to get user's accessible sites for a tenant
CREATE OR REPLACE FUNCTION get_user_accessible_sites(user_id_param UUID, tenant_id_param UUID)
RETURNS TABLE(site_id UUID, site_slug VARCHAR(255), permission_type VARCHAR(50))
LANGUAGE plpgsql
AS $$
BEGIN
    -- Employee pool users with provider permissions can access all sites
    IF check_provider_permissions(user_id_param, 'full_access') THEN
        RETURN QUERY
        SELECT s.id, s.slug, 'provider'::VARCHAR(50)
        FROM sites s
        WHERE s.customer_id = tenant_id_param
        AND s.deleted_at IS NULL;
    ELSE
        -- Return sites where user has specific permissions or tenant permissions
        RETURN QUERY
        SELECT DISTINCT s.id, s.slug, 
               COALESCE(sp.permission_type, tp.permission_type, 'tenant_access'::VARCHAR(50))
        FROM sites s
        LEFT JOIN platform_site_permissions sp ON s.id = sp.site_id 
            AND sp.user_id = user_id_param 
            AND sp.is_active = true 
            AND (sp.expires_at IS NULL OR sp.expires_at > NOW())
            AND sp.deleted_at IS NULL
        LEFT JOIN platform_tenant_permissions tp ON s.customer_id = tp.tenant_id 
            AND tp.user_id = user_id_param 
            AND tp.is_active = true 
            AND (tp.expires_at IS NULL OR tp.expires_at > NOW())
            AND tp.deleted_at IS NULL
        WHERE s.customer_id = tenant_id_param
        AND s.deleted_at IS NULL
        AND (sp.id IS NOT NULL OR tp.id IS NOT NULL);
    END IF;
END $$;

-- =============================================================================
-- PLATFORM COMMENTS
-- =============================================================================

COMMENT ON TABLE platform_users IS 'Platform-level user accounts (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_ciam_systems IS 'Platform-level authentication providers (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_user_ciam_mappings IS 'Platform-level user to CIAM provider mappings (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_oidc_tokens IS 'Platform-level OIDC authentication tokens (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_oidc_sessions IS 'Platform-level user sessions (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_tenant_databases IS 'Platform-level database connection information per tenant (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_keyvault_secrets IS 'Platform-level keyvault secret references (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_tenant_access IS 'Platform-level tenant access control (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_provider_permissions IS 'Provider organization level permissions for SaaS company employees (cross-tenant access)';
COMMENT ON TABLE platform_tenant_permissions IS 'Tenant level permissions for customer owners and their team members';
COMMENT ON TABLE platform_site_permissions IS 'Site level permissions for specific site access within tenants';
COMMENT ON TABLE platform_hierarchical_sessions IS 'Hierarchical session management for tenant and site level access';
COMMENT ON TABLE platform_permission_inheritance IS 'Rules for how permissions inherit from higher levels to lower levels';
COMMENT ON TABLE platform_roles IS 'Platform-level roles for employees and tenant admins (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_user_roles IS 'Platform-level user role assignments (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_permissions IS 'Platform-level permissions for fine-grained access control (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_user_emulations IS 'User emulation sessions for superadmins (cross-tenant, will be moved to separate database)';

-- =============================================================================
-- CONTENT MANAGEMENT COMMENTS
-- =============================================================================

COMMENT ON TABLE site_pages IS 'Site-specific pages with flexible content structure';
COMMENT ON TABLE site_components IS 'Reusable UI components for site customization';
COMMENT ON TABLE site_data_collections IS 'Data collection definitions for site-specific content';
COMMENT ON TABLE site_data_items IS 'Actual data items within collections';
COMMENT ON TABLE site_navigation IS 'Site navigation menus and structure';
COMMENT ON TABLE site_settings IS 'Site-specific configuration settings';
COMMENT ON TABLE site_api_endpoints IS 'Site-specific API endpoint configurations';
COMMENT ON TABLE site_hostname_mappings IS 'Maps hostnames to sites for multi-tenant hosting support';

-- Insert records for all migrations
INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(1, 'initial_schema', 'initial_schema_v1_0', 'success'),
(2, 'cognito_ciam_support', 'cognito_ciam_support_v1_0', 'success'),
(3, 'oidc_agnostic_ciam_support', 'oidc_agnostic_ciam_support_v1_0', 'success'),
(4, 'remove_cognito_backward_compatibility', 'remove_cognito_backward_compatibility_v1_0', 'success'),
(5, 'support_multiple_providers_same_type', 'support_multiple_providers_same_type_v1_0', 'success'),
(6, 'generic_content_management', 'generic_content_management_v1_0', 'success'),
(7, 'migrate_thorne_to_generic', 'migrate_thorne_to_generic_v1_0', 'success'),
(8, 'add_hostname_mapping', 'add_hostname_mapping_v1_0', 'success'),
(9, 'create_platform_tables', 'create_platform_tables_v1_0', 'success'),
(10, 'add_comprehensive_schema_comments', 'add_comprehensive_schema_comments_v1_0', 'success'),
(11, 'restructure_platform_employee_tenant_admin', 'restructure_platform_employee_tenant_admin_v1_0', 'success'),
(12, 'multi_level_permission_system', 'multi_level_permission_system_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;