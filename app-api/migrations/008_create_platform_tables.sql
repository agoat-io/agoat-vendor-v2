-- Migration: 008_create_platform_tables.sql
-- Description: Create platform-level tables for multi-tenant architecture with separate databases
-- Date: 2025-10-01
-- Author: AGoat Publisher Team
--
-- These tables will eventually be moved to a separate platform database.
-- They handle cross-tenant functionality: authentication, users, database connections, etc.
-- Platform tables use the "platform_" prefix and should NOT reference tenant-specific tables.

-- =============================================================================
-- PLATFORM TABLES - AUTHENTICATION & USERS
-- =============================================================================

-- Platform users table (cross-tenant user accounts)
CREATE TABLE platform_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    phone_number VARCHAR(50),
    phone_verified BOOLEAN DEFAULT false,
    full_name VARCHAR(255),
    avatar_url TEXT,
    locale VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    is_platform_admin BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Platform CIAM systems (authentication providers)
CREATE TABLE platform_ciam_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('oidc', 'cognito', 'azure', 'auth0', 'okta', 'google', 'custom')),
    provider_instance_id VARCHAR(255) NOT NULL DEFAULT 'default',
    provider_environment VARCHAR(50) DEFAULT 'production',
    provider_region VARCHAR(50),
    provider_domain VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_default_for_type BOOLEAN DEFAULT false,
    -- OIDC configuration
    jwks_url TEXT,
    issuer_url TEXT NOT NULL,
    oidc_discovery_url TEXT,
    authorization_endpoint TEXT,
    token_endpoint TEXT,
    userinfo_endpoint TEXT,
    end_session_endpoint TEXT,
    revocation_endpoint TEXT,
    -- Client configuration
    client_id VARCHAR(255) NOT NULL,
    client_secret_key_name VARCHAR(255), -- Reference to keyvault secret
    scopes TEXT NOT NULL DEFAULT 'openid profile email',
    response_type VARCHAR(50) NOT NULL DEFAULT 'code',
    response_mode VARCHAR(50) DEFAULT 'query',
    code_challenge_method VARCHAR(10) DEFAULT 'S256',
    -- Claims and metadata
    supported_claims JSONB DEFAULT '[]',
    custom_claims_mapping JSONB DEFAULT '{}',
    provider_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(system_name, provider_instance_id)
);

-- Platform user to CIAM mappings (which auth providers each user can use)
CREATE TABLE platform_user_ciam_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    ciam_system_id UUID NOT NULL REFERENCES platform_ciam_systems(id) ON DELETE CASCADE,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_username VARCHAR(255),
    provider_email VARCHAR(255),
    provider_instance_id VARCHAR(255),
    last_authenticated_at TIMESTAMP WITH TIME ZONE,
    authentication_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(ciam_system_id, provider_user_id)
);

-- Platform OIDC tokens (authentication tokens)
CREATE TABLE platform_oidc_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    ciam_system_id UUID NOT NULL REFERENCES platform_ciam_systems(id) ON DELETE CASCADE,
    provider_instance_id VARCHAR(255),
    token_type VARCHAR(50) NOT NULL DEFAULT 'Bearer',
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    id_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    is_revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform OIDC sessions (user sessions)
CREATE TABLE platform_oidc_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    ciam_system_id UUID NOT NULL REFERENCES platform_ciam_systems(id) ON DELETE CASCADE,
    provider_instance_id VARCHAR(255),
    session_token VARCHAR(500) NOT NULL UNIQUE,
    state VARCHAR(500),
    nonce VARCHAR(500),
    code_verifier VARCHAR(500),
    return_url TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- PLATFORM TABLES - TENANT DATABASE CONNECTIONS
-- =============================================================================

-- Platform tenant databases (database connection info per tenant)
CREATE TABLE platform_tenant_databases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL, -- Reference to customers.id (but no FK since it will be in different DB)
    tenant_slug VARCHAR(255) NOT NULL,
    database_type VARCHAR(50) NOT NULL CHECK (database_type IN ('shared', 'dedicated', 'cluster')),
    connection_string_key_name VARCHAR(255) NOT NULL, -- Reference to keyvault secret
    database_name VARCHAR(255) NOT NULL,
    database_host VARCHAR(255) NOT NULL,
    database_port INTEGER NOT NULL DEFAULT 26257,
    database_user_key_name VARCHAR(255), -- Reference to keyvault secret for username
    database_password_key_name VARCHAR(255), -- Reference to keyvault secret for password
    ssl_enabled BOOLEAN DEFAULT true,
    ssl_cert_key_name VARCHAR(255), -- Reference to keyvault secret for SSL cert
    connection_pool_size INTEGER DEFAULT 10,
    connection_timeout_seconds INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT true,
    read_only BOOLEAN DEFAULT false,
    region VARCHAR(50),
    provider VARCHAR(50) CHECK (provider IN ('cockroachdb', 'postgresql', 'azure', 'aws', 'gcp')),
    metadata JSONB DEFAULT '{}',
    health_check_url TEXT,
    last_health_check_at TIMESTAMP WITH TIME ZONE,
    last_health_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, database_name)
);

-- Platform keyvault references (centralized secret management)
CREATE TABLE platform_keyvault_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_name VARCHAR(255) NOT NULL UNIQUE,
    secret_type VARCHAR(50) NOT NULL CHECK (secret_type IN ('connection_string', 'password', 'api_key', 'certificate', 'token', 'other')),
    keyvault_provider VARCHAR(50) NOT NULL CHECK (keyvault_provider IN ('azure', 'aws', 'gcp', 'hashicorp', 'local')),
    keyvault_name VARCHAR(255) NOT NULL,
    secret_identifier TEXT NOT NULL, -- Full path/identifier in the keyvault
    version VARCHAR(50),
    description TEXT,
    rotation_enabled BOOLEAN DEFAULT false,
    rotation_interval_days INTEGER,
    last_rotated_at TIMESTAMP WITH TIME ZONE,
    next_rotation_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Platform tenant access mapping (which platform users can access which tenants)
CREATE TABLE platform_tenant_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL, -- Reference to customers.id (but no FK since it will be in different DB)
    tenant_slug VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer', 'billing')),
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    invited_by_user_id UUID REFERENCES platform_users(id),
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    last_access_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, tenant_id)
);

-- =============================================================================
-- PLATFORM INDEXES
-- =============================================================================

-- Platform users indexes
CREATE INDEX idx_platform_users_email ON platform_users (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_username ON platform_users (username) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_active ON platform_users (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_last_login ON platform_users (last_login_at DESC) WHERE deleted_at IS NULL;

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

-- =============================================================================
-- MIGRATION RECORD
-- =============================================================================

INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(8, 'create_platform_tables', 'create_platform_tables_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
