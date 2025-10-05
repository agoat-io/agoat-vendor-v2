-- Current Real Database Schema: _current--real-schema.sql
-- Description: ACTUAL database schema that the API is using (extracted from real database)
-- Date: 2025-10-04
-- Author: AGoat Publisher Team
-- 
-- This file contains the ACTUAL current database schema based on:
-- 1. Analysis of _current--full-data.sql (real data)
-- 2. API query analysis (what fields the API expects)
-- 3. Database functionality verification (API is working)
--
-- This represents the REAL working database schema, not the theoretical one.

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID extension for better distribution (CockroachDB has gen_random_uuid() built-in)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- REAL DATABASE TABLES (Based on Actual Data Analysis)
-- =============================================================================

-- =============================================================================
-- USERS TABLE (Real Schema)
-- =============================================================================
-- Based on actual data in _current--full-data.sql and API queries
-- This table has evolved to include both legacy and modern authentication fields

CREATE TABLE users (
    id BIGINT NOT NULL DEFAULT unique_rowid(), -- Primary key (CockroachDB sequential)
    username VARCHAR(255) NOT NULL, -- Username for login -- auth_unique: <user_identifier> -- origin: user_input, JWT.preferred_username, Azure.preferred_username
    email VARCHAR(255) NOT NULL, -- Email address (unique) -- auth_unique: <user_identifier> -- origin: user_input, JWT.email, Azure.email, Cognito.email
    password_hash VARCHAR(255) NOT NULL, -- Legacy password hash
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Account creation time
    
    -- Multi-tenant fields
    customer_id UUID, -- Reference to customers table
    site_id UUID, -- Reference to sites table
    role VARCHAR(50), -- User role (admin, user, etc.)
    status VARCHAR(50), -- Account status (active, inactive, etc.)
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp
    
    -- External identity fields
    external_id VARCHAR(255), -- External system ID -- auth_unique: <external_system_identifier> -- origin: external_system.user_id, JWT.sub, Azure.objectId
    iam_provider VARCHAR(50), -- Identity provider (default, azure, cognito, etc.) -- auth_unique: <identity_provider_service> -- origin: config.identity_provider, provider.type
    iam_metadata JSONB DEFAULT '{}', -- Provider-specific metadata
    last_iam_sync TIMESTAMP WITH TIME ZONE, -- Last sync with external system
    iam_sync_status VARCHAR(50), -- Sync status (pending, success, failed)
    
    -- Azure Entra ID fields (legacy)
    azure_entra_id VARCHAR(255), -- Azure Entra ID -- auth_unique: <azure_user_identifier> -- origin: Azure.oid, JWT.oid, Azure.id_token.oid
    azure_tenant_id VARCHAR(255), -- Azure tenant ID -- auth_unique: <azure_tenant_pool> -- origin: Azure.tid, JWT.tid, Azure.id_token.tid
    azure_object_id VARCHAR(255), -- Azure object ID -- auth_unique: <azure_object_identifier> -- origin: Azure.objectId, JWT.objectId, Azure.id_token.objectId
    azure_principal_name VARCHAR(255), -- Azure principal name -- auth_unique: <azure_principal_identifier> -- origin: Azure.preferred_username, JWT.preferred_username, Azure.id_token.preferred_username
    azure_display_name VARCHAR(255), -- Azure display name
    azure_given_name VARCHAR(255), -- Azure given name
    azure_family_name VARCHAR(255), -- Azure family name
    azure_preferred_username VARCHAR(255), -- Azure preferred username -- auth_unique: <azure_username_identifier> -- origin: Azure.preferred_username, JWT.preferred_username, Azure.id_token.preferred_username
    
    -- Token management fields
    access_token_hash VARCHAR(255), -- Hashed access token
    refresh_token_hash VARCHAR(255), -- Hashed refresh token
    token_expires_at TIMESTAMP WITH TIME ZONE, -- Token expiration
    last_token_refresh TIMESTAMP WITH TIME ZONE, -- Last token refresh
    
    -- Authentication method and status
    auth_method VARCHAR(50), -- Authentication method (password, azure_entra, cognito, oidc) -- auth_unique: <authentication_method> -- origin: config.auth_method, JWT.auth_method, provider.type
    email_verified BOOLEAN DEFAULT FALSE, -- Email verification status
    account_enabled BOOLEAN DEFAULT TRUE, -- Account enabled status
    last_login_at TIMESTAMP WITH TIME ZONE, -- Last successful login
    login_count INTEGER DEFAULT 0, -- Number of logins
    
    -- Azure-specific timestamps
    created_by_azure BOOLEAN DEFAULT FALSE, -- Created via Azure
    azure_created_at TIMESTAMP WITH TIME ZONE, -- Azure creation time
    azure_updated_at TIMESTAMP WITH TIME ZONE, -- Azure last update
    
    -- Standard timestamps
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last update time
    
    -- Constraints
    PRIMARY KEY (id),
    UNIQUE (email),
    UNIQUE (username)
);

-- =============================================================================
-- POSTS TABLE (Real Schema)
-- =============================================================================
-- Based on actual data in _current--full-data.sql and API queries
-- This table supports multi-tenant content management

CREATE TABLE posts (
    id BIGINT NOT NULL DEFAULT unique_rowid(), -- Primary key (CockroachDB sequential)
    user_id BIGINT NOT NULL, -- Reference to users table
    title VARCHAR(255) NOT NULL, -- Post title
    content TEXT NOT NULL, -- Post content (HTML/Markdown)
    slug VARCHAR(255) NOT NULL, -- URL-friendly slug
    published BOOLEAN DEFAULT FALSE, -- Published status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Creation time
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last update time
    
    -- Multi-tenant fields
    site_id UUID NOT NULL, -- Reference to sites table (multi-tenant)
    status VARCHAR(50) DEFAULT 'draft', -- Post status (draft, published, archived)
    published_at TIMESTAMP WITH TIME ZONE, -- Publication time
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp
    
    -- Constraints
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE (slug, site_id) -- Unique slug per site
);

-- =============================================================================
-- CUSTOMERS TABLE (Multi-tenant)
-- =============================================================================
-- Based on verification queries in _current--full-data.sql
-- This table manages customer/tenant information

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
    name VARCHAR(255) NOT NULL, -- Customer name
    slug VARCHAR(255) NOT NULL UNIQUE, -- URL-friendly identifier
    domain VARCHAR(255), -- Customer domain
    status VARCHAR(50) DEFAULT 'active', -- Customer status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- SITES TABLE (Multi-tenant)
-- =============================================================================
-- Based on verification queries in _current--full-data.sql
-- This table manages sites within customers

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
    customer_id UUID NOT NULL, -- Reference to customers table
    name VARCHAR(255) NOT NULL, -- Site name
    slug VARCHAR(255) NOT NULL, -- URL-friendly identifier
    domain VARCHAR(255), -- Site domain
    status VARCHAR(50) DEFAULT 'active', -- Site status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    UNIQUE (slug, customer_id) -- Unique slug per customer
);

-- =============================================================================
-- CIAM SYSTEMS TABLE (Authentication)
-- =============================================================================
-- Based on verification queries in _current--full-data.sql
-- This table manages CIAM (Customer Identity and Access Management) systems

CREATE TABLE ciam_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
    system_name VARCHAR(50) NOT NULL UNIQUE, -- System identifier (cognito, azure_entra, etc.) -- auth_unique: <ciam_system_identifier> -- origin: config.system_name, provider.name
    display_name VARCHAR(100) NOT NULL, -- Human-readable name
    provider_type VARCHAR(50) DEFAULT 'oidc', -- Provider type (oidc, oauth2, saml, custom) -- auth_unique: <identity_provider_service> -- origin: config.provider_type, provider.type
    is_active BOOLEAN DEFAULT TRUE, -- Active status
    
    -- Provider instance identification
    provider_instance_id VARCHAR(255) NOT NULL DEFAULT 'default', -- Instance identifier -- auth_unique: <provider_instance_pool> -- origin: config.instance_id, provider.instance_id
    provider_environment VARCHAR(50) DEFAULT 'production', -- Environment -- auth_unique: <provider_environment> -- origin: config.environment, provider.environment
    provider_region VARCHAR(50), -- Provider region -- auth_unique: <provider_region> -- origin: config.region, provider.region
    provider_domain VARCHAR(255), -- Provider domain -- auth_unique: <provider_domain> -- origin: config.domain, provider.domain
    is_default_for_type BOOLEAN DEFAULT FALSE, -- Default for provider type
    
    -- OIDC Standard Endpoints
    jwks_url TEXT, -- JSON Web Key Set URL
    issuer_url TEXT, -- OIDC issuer URL -- auth_unique: <oidc_issuer_identifier> -- origin: config.issuer_url, OIDC.discovery.issuer
    oidc_discovery_url TEXT, -- OIDC discovery endpoint
    authorization_endpoint TEXT, -- OAuth authorization endpoint
    token_endpoint TEXT, -- OAuth token endpoint
    userinfo_endpoint TEXT, -- OIDC userinfo endpoint
    end_session_endpoint TEXT, -- OIDC end session endpoint
    
    -- OAuth2/OIDC Configuration
    client_id VARCHAR(255), -- OAuth2 Client ID -- auth_unique: <oauth_client_identifier> -- origin: config.client_id, JWT.aud, OAuth.client_id
    client_secret_encrypted TEXT, -- Encrypted client secret
    scopes TEXT DEFAULT 'openid profile email', -- OAuth2 scopes
    response_type VARCHAR(50) DEFAULT 'code', -- OAuth2 response type
    response_mode VARCHAR(50) DEFAULT 'query', -- OAuth2 response mode
    code_challenge_method VARCHAR(50) DEFAULT 'S256', -- PKCE method
    
    -- Claims and metadata
    supported_claims JSONB DEFAULT '{}', -- Supported claims schema
    provider_metadata JSONB DEFAULT '{}', -- Provider-specific metadata
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- USER CIAM MAPPINGS TABLE (Authentication)
-- =============================================================================
-- This table maps users to CIAM systems for authentication

CREATE TABLE user_ciam_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
    app_user_id BIGINT NOT NULL, -- Reference to users table
    ciam_identifier VARCHAR(255) NOT NULL, -- CIAM user identifier -- auth_unique: <ciam_user_identifier> -- origin: JWT.sub, Azure.oid, Cognito.sub, OIDC.id_token.sub
    ciam_system VARCHAR(50) NOT NULL, -- CIAM system name -- auth_unique: <ciam_system_identifier> -- origin: config.system_name, provider.name
    provider_identifier VARCHAR(255), -- Provider-specific identifier -- auth_unique: <provider_user_identifier> -- origin: JWT.sub, Azure.objectId, Cognito.username, provider.user_id
    provider_metadata JSONB DEFAULT '{}', -- Provider-specific metadata
    is_current_ciam BOOLEAN DEFAULT FALSE, -- Current active CIAM
    last_authenticated_at TIMESTAMP WITH TIME ZONE, -- Last authentication
    authentication_method VARCHAR(50) DEFAULT 'oidc', -- Auth method -- auth_unique: <authentication_method> -- origin: config.auth_method, JWT.auth_method, provider.type
    token_metadata JSONB DEFAULT '{}', -- Token metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    FOREIGN KEY (app_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(app_user_id, ciam_identifier, ciam_system)
);

-- =============================================================================
-- MIGRATION STATUS TABLE (Migration Tracking)
-- =============================================================================
-- Based on verification queries in _current--full-data.sql
-- This table tracks applied migrations

CREATE TABLE migration_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key
    version INTEGER NOT NULL UNIQUE, -- Migration version number
    name VARCHAR(255) NOT NULL, -- Migration name
    checksum VARCHAR(255), -- Migration checksum
    status VARCHAR(50) DEFAULT 'success', -- Migration status
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Application time
    description TEXT -- Migration description
);

-- =============================================================================
-- INDEXES (Based on API Query Patterns)
-- =============================================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_customer_id ON users (customer_id);
CREATE INDEX idx_users_site_id ON users (site_id);
CREATE INDEX idx_users_auth_method ON users (auth_method);
CREATE INDEX idx_users_status ON users (status);
CREATE INDEX idx_users_deleted_at ON users (deleted_at);

-- Posts table indexes
CREATE INDEX idx_posts_user_id ON posts (user_id);
CREATE INDEX idx_posts_site_id ON posts (site_id);
CREATE INDEX idx_posts_published ON posts (published);
CREATE INDEX idx_posts_status ON posts (status);
CREATE INDEX idx_posts_slug ON posts (slug);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX idx_posts_deleted_at ON posts (deleted_at);

-- Customers table indexes
CREATE INDEX idx_customers_slug ON customers (slug);
CREATE INDEX idx_customers_status ON customers (status);
CREATE INDEX idx_customers_deleted_at ON customers (deleted_at);

-- Sites table indexes
CREATE INDEX idx_sites_customer_id ON sites (customer_id);
CREATE INDEX idx_sites_slug ON sites (slug);
CREATE INDEX idx_sites_status ON sites (status);
CREATE INDEX idx_sites_deleted_at ON sites (deleted_at);

-- CIAM systems indexes
CREATE INDEX idx_ciam_systems_system_name ON ciam_systems (system_name);
CREATE INDEX idx_ciam_systems_provider_type ON ciam_systems (provider_type);
CREATE INDEX idx_ciam_systems_active ON ciam_systems (is_active);

-- User CIAM mappings indexes
CREATE INDEX idx_user_ciam_mappings_app_user_id ON user_ciam_mappings (app_user_id);
CREATE INDEX idx_user_ciam_mappings_ciam_identifier ON user_ciam_mappings (ciam_identifier);
CREATE INDEX idx_user_ciam_mappings_ciam_system ON user_ciam_mappings (ciam_system);
CREATE INDEX idx_user_ciam_mappings_current ON user_ciam_mappings (app_user_id, is_current_ciam) WHERE is_current_ciam = TRUE;

-- Migration status indexes
CREATE INDEX idx_migration_status_version ON migration_status (version);
CREATE INDEX idx_migration_status_status ON migration_status (status);

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

CREATE TRIGGER trigger_update_ciam_systems_updated_at
    BEFORE UPDATE ON ciam_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_user_ciam_mappings_updated_at
    BEFORE UPDATE ON user_ciam_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE users IS 'User accounts with support for multiple authentication methods and multi-tenancy';
COMMENT ON TABLE posts IS 'Content posts with multi-tenant support and soft delete';
COMMENT ON TABLE customers IS 'Customer/tenant information for multi-tenant architecture';
COMMENT ON TABLE sites IS 'Sites within customers for multi-tenant content management';
COMMENT ON TABLE ciam_systems IS 'CIAM (Customer Identity and Access Management) system configurations';
COMMENT ON TABLE user_ciam_mappings IS 'Mappings between users and CIAM systems for authentication';
COMMENT ON TABLE migration_status IS 'Tracks applied database migrations';

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Insert record for this schema
INSERT INTO migration_status (version, name, checksum, status, description)
VALUES (0, 'real_database_schema', 'real_database_schema_v1_0', 'success', 'Real database schema extracted from working system')
ON CONFLICT (version) DO NOTHING;
