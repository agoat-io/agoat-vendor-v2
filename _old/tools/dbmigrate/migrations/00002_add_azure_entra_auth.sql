-- Migration: 00002_add_azure_entra_auth.sql
-- Description: Add Azure Entra ID OIDC authentication support
-- Date: 2025-01-25
-- Author: AGoat Publisher Team

-- =============================================================================
-- UPDATE USERS TABLE FOR AZURE ENTRA ID INTEGRATION
-- =============================================================================

-- Make password_hash nullable for Azure users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add Azure Entra ID specific columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_entra_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_tenant_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_object_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_principal_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_given_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_family_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_preferred_username VARCHAR(255);

-- Add OIDC token management columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_token_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_token_refresh TIMESTAMP;

-- Add authentication method tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method VARCHAR(50) DEFAULT 'password' 
    CHECK (auth_method IN ('password', 'azure_entra', 'oidc'));

-- Add account status and verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Add audit columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by_azure BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_created_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_updated_at TIMESTAMP;

-- Add updated_at column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT current_timestamp();

-- =============================================================================
-- CREATE AZURE ENTRA ID SESSIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS azure_entra_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255),
    token_expires_at TIMESTAMP NOT NULL,
    scope TEXT,
    azure_tenant_id VARCHAR(255) NOT NULL,
    azure_object_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    last_activity TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    user_agent TEXT,
    ip_address INET,
    device_info JSONB DEFAULT '{}'
);

-- =============================================================================
-- CREATE AZURE ENTRA ID TOKEN CACHE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS azure_entra_token_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh', 'id')),
    token_hash VARCHAR(255) NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    scope TEXT,
    azure_tenant_id VARCHAR(255) NOT NULL,
    azure_object_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    last_used TIMESTAMP,
    use_count INTEGER DEFAULT 0
);

-- =============================================================================
-- CREATE AZURE ENTRA ID CONFIGURATION TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS azure_entra_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) UNIQUE NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    client_secret_hash VARCHAR(255),
    authority_url VARCHAR(500) NOT NULL,
    redirect_uri VARCHAR(500) NOT NULL,
    scope TEXT NOT NULL DEFAULT 'openid profile email',
    response_type VARCHAR(100) DEFAULT 'code',
    response_mode VARCHAR(100) DEFAULT 'query',
    code_challenge_method VARCHAR(50) DEFAULT 'S256',
    token_endpoint VARCHAR(500) NOT NULL,
    userinfo_endpoint VARCHAR(500) NOT NULL,
    jwks_uri VARCHAR(500) NOT NULL,
    issuer VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Users table indexes for Azure Entra ID queries
CREATE INDEX IF NOT EXISTS idx_users_azure_entra_id ON users (azure_entra_id) WHERE azure_entra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_azure_object_id ON users (azure_object_id) WHERE azure_object_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_azure_tenant_id ON users (azure_tenant_id) WHERE azure_tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_method ON users (auth_method);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users (email_verified);
CREATE INDEX IF NOT EXISTS idx_users_account_enabled ON users (account_enabled);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users (last_login_at DESC);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_azure_sessions_user_id ON azure_entra_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_azure_sessions_session_id ON azure_entra_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_azure_sessions_active ON azure_entra_sessions (is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_azure_sessions_tenant_object ON azure_entra_sessions (azure_tenant_id, azure_object_id);
CREATE INDEX IF NOT EXISTS idx_azure_sessions_last_activity ON azure_entra_sessions (last_activity DESC);

-- Token cache table indexes
CREATE INDEX IF NOT EXISTS idx_azure_token_cache_user_id ON azure_entra_token_cache (user_id);
CREATE INDEX IF NOT EXISTS idx_azure_token_cache_type_expires ON azure_entra_token_cache (token_type, token_expires_at);
CREATE INDEX IF NOT EXISTS idx_azure_token_cache_tenant_object ON azure_entra_token_cache (azure_tenant_id, azure_object_id);
CREATE INDEX IF NOT EXISTS idx_azure_token_cache_expires ON azure_entra_token_cache (token_expires_at);

-- Configuration table indexes
CREATE INDEX IF NOT EXISTS idx_azure_config_tenant_id ON azure_entra_config (tenant_id);
CREATE INDEX IF NOT EXISTS idx_azure_config_active ON azure_entra_config (is_active) WHERE is_active = true;

-- =============================================================================
-- INSERT DEFAULT AZURE ENTRA ID CONFIGURATION
-- =============================================================================

INSERT INTO azure_entra_config (
    tenant_id,
    tenant_name,
    client_id,
    authority_url,
    redirect_uri,
    scope,
    token_endpoint,
    userinfo_endpoint,
    jwks_uri,
    issuer
) VALUES (
    'common',
    'Local Development Tenant',
    'your-client-id-here',
    'https://login.microsoftonline.com/common/v2.0',
    'http://local.topvitaminsupply.com:3000/auth/callback',
    'openid profile email',
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    'https://graph.microsoft.com/oidc/userinfo',
    'https://login.microsoftonline.com/common/discovery/v2.0/keys',
    'https://login.microsoftonline.com/common/v2.0'
) ON CONFLICT (tenant_id) DO NOTHING;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Mark migration as applied
INSERT INTO schema_migrations (version, applied_at) 
VALUES (2, current_timestamp())
ON CONFLICT (version) DO UPDATE SET applied_at = current_timestamp();