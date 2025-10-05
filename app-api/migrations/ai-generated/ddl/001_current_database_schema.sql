-- AGoat Publisher - Current Database Schema (AI Generated)
-- Generated on: 2025-10-05
-- Source: Live database analysis
-- Description: Complete DDL for current database state

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID extension for better distribution (CockroachDB has gen_random_uuid() built-in)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SCHEMA MIGRATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms BIGINT,
    status VARCHAR(20) DEFAULT 'success'::STRING,
    error_message TEXT
);

-- Indexes for schema_migrations
CREATE INDEX IF NOT EXISTS idx_schema_migrations_status ON schema_migrations (status);
CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at ON schema_migrations (applied_at DESC);

-- =============================================================================
-- CUSTOMERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active'::STRING NOT NULL
        CONSTRAINT check_status CHECK (status IN ('active'::STRING, 'suspended'::STRING, 'cancelled'::STRING)),
    subscription_plan VARCHAR(100) DEFAULT 'basic'::STRING NOT NULL,
    subscription_status VARCHAR(50) DEFAULT 'active'::STRING NOT NULL
        CONSTRAINT check_subscription_status CHECK (subscription_status IN ('active'::STRING, 'trial'::STRING, 'expired'::STRING, 'cancelled'::STRING)),
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    max_sites BIGINT DEFAULT 1 NOT NULL,
    max_storage_gb BIGINT DEFAULT 10 NOT NULL,
    max_bandwidth_gb BIGINT DEFAULT 100 NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp() NOT NULL,
    updated_at TIMESTAMP DEFAULT current_timestamp() NOT NULL,
    deleted_at TIMESTAMP
);

COMMENT ON TABLE customers IS 'Customer accounts for multitenant architecture';

-- =============================================================================
-- SITES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS sites (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    customer_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active'::STRING NOT NULL
        CONSTRAINT check_site_status CHECK (status IN ('active'::STRING, 'suspended'::STRING, 'cancelled'::STRING)),
    created_at TIMESTAMP DEFAULT current_timestamp() NOT NULL,
    updated_at TIMESTAMP DEFAULT current_timestamp() NOT NULL,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

COMMENT ON TABLE sites IS 'Sites within customers for multitenant content management';

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL DEFAULT unique_rowid() PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Multi-tenant fields
    customer_id UUID,
    site_id UUID,
    role VARCHAR(50),
    status VARCHAR(50),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- External identity fields
    external_id VARCHAR(255),
    iam_provider VARCHAR(50),
    iam_metadata JSONB DEFAULT '{}',
    last_iam_sync TIMESTAMP WITH TIME ZONE,
    iam_sync_status VARCHAR(50),
    
    -- Azure Entra ID fields (legacy)
    azure_entra_id VARCHAR(255),
    azure_tenant_id VARCHAR(255),
    azure_object_id VARCHAR(255),
    azure_principal_name VARCHAR(255),
    azure_display_name VARCHAR(255),
    azure_given_name VARCHAR(255),
    azure_family_name VARCHAR(255),
    azure_preferred_username VARCHAR(255),
    
    -- Token management fields
    access_token_hash VARCHAR(255),
    refresh_token_hash VARCHAR(255),
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_token_refresh TIMESTAMP WITH TIME ZONE,
    
    -- Authentication method and status
    auth_method VARCHAR(50),
    email_verified BOOLEAN DEFAULT FALSE,
    account_enabled BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Azure-specific timestamps
    created_by_azure BOOLEAN DEFAULT FALSE,
    azure_created_at TIMESTAMP WITH TIME ZONE,
    azure_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Standard timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (site_id) REFERENCES sites(id)
);

COMMENT ON TABLE users IS 'User accounts with support for multiple authentication methods and multi-tenancy';

-- =============================================================================
-- POSTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS posts (
    id BIGINT NOT NULL DEFAULT unique_rowid() PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Multi-tenant fields
    site_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (site_id) REFERENCES sites(id),
    UNIQUE (slug, site_id)
);

COMMENT ON TABLE posts IS 'Content posts with multi-tenant support and soft delete';

-- =============================================================================
-- AZURE ENTRA CONFIG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS azure_entra_config (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret_encrypted TEXT,
    authority_url VARCHAR(500),
    redirect_uri VARCHAR(500),
    scopes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE (tenant_id, client_id)
);

COMMENT ON TABLE azure_entra_config IS 'Azure Entra ID configuration for authentication';

-- =============================================================================
-- AZURE ENTRA SESSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS azure_entra_sessions (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id VARCHAR(255) NOT NULL UNIQUE,
    access_token_hash VARCHAR(255),
    refresh_token_hash VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

COMMENT ON TABLE azure_entra_sessions IS 'Azure Entra ID user sessions';

-- =============================================================================
-- AZURE ENTRA TOKEN CACHE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS azure_entra_token_cache (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (user_id, token_type)
);

COMMENT ON TABLE azure_entra_token_cache IS 'Azure Entra ID token cache';

-- =============================================================================
-- IAM PROVIDERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS iam_providers (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) DEFAULT 'oidc',
    is_active BOOLEAN DEFAULT TRUE,
    provider_instance_id VARCHAR(255) DEFAULT 'default',
    provider_environment VARCHAR(50) DEFAULT 'production',
    provider_region VARCHAR(50),
    provider_domain VARCHAR(255),
    is_default_for_type BOOLEAN DEFAULT FALSE,
    jwks_url TEXT,
    issuer_url TEXT,
    oidc_discovery_url TEXT,
    authorization_endpoint TEXT,
    token_endpoint TEXT,
    userinfo_endpoint TEXT,
    end_session_endpoint TEXT,
    client_id VARCHAR(255),
    client_secret_encrypted TEXT,
    scopes TEXT DEFAULT 'openid profile email',
    response_type VARCHAR(50) DEFAULT 'code',
    response_mode VARCHAR(50) DEFAULT 'query',
    code_challenge_method VARCHAR(50) DEFAULT 'S256',
    supported_claims JSONB DEFAULT '{}',
    provider_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE iam_providers IS 'IAM (Identity and Access Management) provider configurations';

-- =============================================================================
-- IAM USER MAPPINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS iam_user_mappings (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    app_user_id BIGINT NOT NULL,
    iam_identifier VARCHAR(255) NOT NULL,
    iam_provider VARCHAR(50) NOT NULL,
    provider_identifier VARCHAR(255),
    provider_metadata JSONB DEFAULT '{}',
    is_current_iam BOOLEAN DEFAULT FALSE,
    last_authenticated_at TIMESTAMP WITH TIME ZONE,
    authentication_method VARCHAR(50) DEFAULT 'oidc',
    token_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (app_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(app_user_id, iam_identifier, iam_provider)
);

COMMENT ON TABLE iam_user_mappings IS 'Mappings between users and IAM providers for authentication';

-- =============================================================================
-- IAM GROUP MAPPINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS iam_group_mappings (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    app_user_id BIGINT NOT NULL,
    group_name VARCHAR(255) NOT NULL,
    iam_provider VARCHAR(50) NOT NULL,
    provider_group_id VARCHAR(255),
    group_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (app_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(app_user_id, group_name, iam_provider)
);

COMMENT ON TABLE iam_group_mappings IS 'Mappings between users and IAM groups';

-- =============================================================================
-- DOMAINS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS domains (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    site_id UUID NOT NULL,
    domain_name VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    ssl_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (site_id) REFERENCES sites(id),
    UNIQUE (domain_name)
);

COMMENT ON TABLE domains IS 'Domain mappings for sites';

-- =============================================================================
-- SITE SETTINGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    site_id UUID NOT NULL,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (site_id) REFERENCES sites(id),
    UNIQUE (site_id, setting_key)
);

COMMENT ON TABLE site_settings IS 'Site-specific configuration settings';

-- =============================================================================
-- TENANT USAGE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS tenant_usage (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    customer_id UUID NOT NULL,
    site_id UUID,
    usage_type VARCHAR(50) NOT NULL,
    usage_count BIGINT DEFAULT 0,
    usage_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (site_id) REFERENCES sites(id),
    UNIQUE (customer_id, site_id, usage_type, usage_date)
);

COMMENT ON TABLE tenant_usage IS 'Usage tracking for tenants and sites';

-- =============================================================================
-- AUDIT LOGS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

COMMENT ON TABLE audit_logs IS 'Audit trail for user actions and system events';

-- =============================================================================
-- FLYWAY SCHEMA HISTORY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INTEGER NOT NULL PRIMARY KEY,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INTEGER,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP DEFAULT NOW() NOT NULL,
    execution_time INTEGER NOT NULL,
    success BOOLEAN NOT NULL
);

COMMENT ON TABLE flyway_schema_history IS 'Flyway migration history tracking';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users (customer_id);
CREATE INDEX IF NOT EXISTS idx_users_site_id ON users (site_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_method ON users (auth_method);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id);
CREATE INDEX IF NOT EXISTS idx_posts_site_id ON posts (site_id);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts (published);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts (slug);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts (deleted_at);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers (deleted_at);

-- Sites table indexes
CREATE INDEX IF NOT EXISTS idx_sites_customer_id ON sites (customer_id);
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites (slug);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites (status);
CREATE INDEX IF NOT EXISTS idx_sites_deleted_at ON sites (deleted_at);

-- IAM providers indexes
CREATE INDEX IF NOT EXISTS idx_iam_providers_name ON iam_providers (name);
CREATE INDEX IF NOT EXISTS idx_iam_providers_provider_type ON iam_providers (provider_type);
CREATE INDEX IF NOT EXISTS idx_iam_providers_active ON iam_providers (is_active);

-- IAM user mappings indexes
CREATE INDEX IF NOT EXISTS idx_iam_user_mappings_app_user_id ON iam_user_mappings (app_user_id);
CREATE INDEX IF NOT EXISTS idx_iam_user_mappings_iam_identifier ON iam_user_mappings (iam_identifier);
CREATE INDEX IF NOT EXISTS idx_iam_user_mappings_iam_provider ON iam_user_mappings (iam_provider);
CREATE INDEX IF NOT EXISTS idx_iam_user_mappings_current ON iam_user_mappings (app_user_id, is_current_iam) WHERE is_current_iam = TRUE;

-- Azure Entra sessions indexes
CREATE INDEX IF NOT EXISTS idx_azure_entra_sessions_user_id ON azure_entra_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_azure_entra_sessions_session_id ON azure_entra_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_azure_entra_sessions_expires_at ON azure_entra_sessions (expires_at);

-- Azure Entra token cache indexes
CREATE INDEX IF NOT EXISTS idx_azure_entra_token_cache_user_id ON azure_entra_token_cache (user_id);
CREATE INDEX IF NOT EXISTS idx_azure_entra_token_cache_expires_at ON azure_entra_token_cache (expires_at);

-- Domains indexes
CREATE INDEX IF NOT EXISTS idx_domains_site_id ON domains (site_id);
CREATE INDEX IF NOT EXISTS idx_domains_domain_name ON domains (domain_name);

-- Site settings indexes
CREATE INDEX IF NOT EXISTS idx_site_settings_site_id ON site_settings (site_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings (setting_key);

-- Tenant usage indexes
CREATE INDEX IF NOT EXISTS idx_tenant_usage_customer_id ON tenant_usage (customer_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_site_id ON tenant_usage (site_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_date ON tenant_usage (usage_date);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs (resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

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
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_azure_entra_config_updated_at
    BEFORE UPDATE ON azure_entra_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_azure_entra_sessions_updated_at
    BEFORE UPDATE ON azure_entra_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_iam_providers_updated_at
    BEFORE UPDATE ON iam_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_iam_user_mappings_updated_at
    BEFORE UPDATE ON iam_user_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_iam_group_mappings_updated_at
    BEFORE UPDATE ON iam_group_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_domains_updated_at
    BEFORE UPDATE ON domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_tenant_usage_updated_at
    BEFORE UPDATE ON tenant_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
