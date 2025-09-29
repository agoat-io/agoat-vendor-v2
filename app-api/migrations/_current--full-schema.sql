-- Current Full Schema: _current--full-schema.sql
-- Description: Complete database schema for AGoat Publisher with OIDC-agnostic CIAM support (no backward compatibility)
-- Date: 2024-09-28
-- Author: AGoat Publisher Team
-- 
-- This file contains the complete current database schema combining all migrations:
-- - 001_initial_schema.sql: Base tables and Azure Entra ID support
-- - 002_cognito_ciam_support.sql: Cognito and multi-CIAM support
-- - 003_oidc_agnostic_ciam_support.sql: OIDC-agnostic CIAM system
-- - 004_remove_cognito_backward_compatibility.sql: Remove backward compatibility
--
-- This schema represents the current state after all migrations have been applied.
-- OIDC provider alignment is ONLY through the user_ciam_mappings table.

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

-- Enable UUID extension for better distribution (CockroachDB has gen_random_uuid() built-in)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CORE BUSINESS TABLES
-- =============================================================================

-- Customer accounts for multitenant architecture
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    subscription_plan VARCHAR(100) NOT NULL DEFAULT 'basic',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    max_sites INTEGER NOT NULL DEFAULT 1,
    max_storage_gb INTEGER NOT NULL DEFAULT 10,
    max_bandwidth_gb INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Sites belonging to customers
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    template VARCHAR(100) DEFAULT 'default',
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(customer_id, slug)
);

-- User accounts with OIDC-compliant authentication support only
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Can be NULL if only external auth is used
    
    -- OIDC Standard Claims - from JWT ID tokens
    oidc_sub VARCHAR(255), -- OIDC 'sub' claim - unique subject identifier
    oidc_issuer VARCHAR(255), -- OIDC 'iss' claim - token issuer
    oidc_audience VARCHAR(255), -- OIDC 'aud' claim - intended audience
    
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
    auth_method VARCHAR(50) DEFAULT 'local' CHECK (auth_method IN ('local', 'oidc')),
    email_verified BOOLEAN DEFAULT false,
    account_enabled BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- OIDC Timestamps - from provider user creation/update events
    oidc_created_at TIMESTAMP WITH TIME ZONE, -- When user was created in OIDC provider
    oidc_updated_at TIMESTAMP WITH TIME ZONE, -- When user was last updated in OIDC provider
    
    -- Provider-specific metadata - flexible storage for provider-specific data
    provider_metadata JSONB DEFAULT '{}', -- Provider-specific user data
    
    -- Standard timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Content posts with tenant context
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- CIAM (CUSTOMER IDENTITY AND ACCESS MANAGEMENT) TABLES
-- =============================================================================

-- OIDC-compliant CIAM system configurations supporting multiple providers
CREATE TABLE ciam_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name VARCHAR(50) NOT NULL, -- 'cognito', 'azure_entra', 'auth0', etc.
    display_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) DEFAULT 'oidc' CHECK (provider_type IN ('oidc', 'oauth2', 'saml', 'custom')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Provider instance identification
    provider_instance_id VARCHAR(255) NOT NULL DEFAULT 'default', -- Unique identifier for specific instance/environment/pool
    provider_environment VARCHAR(50) DEFAULT 'production' CHECK (provider_environment IN ('production', 'staging', 'development', 'test', 'local')),
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
    client_id VARCHAR(255), -- OAuth2 Client ID - unique identifier for this application
    client_secret_encrypted TEXT, -- OAuth2 Client Secret - secret key for confidential clients (encrypted)
    scopes TEXT DEFAULT 'openid profile email', -- OAuth2 Scopes - permissions requested from the provider
    response_type VARCHAR(50) DEFAULT 'code', -- OAuth2 Response Type - how the authorization response is returned
    response_mode VARCHAR(50) DEFAULT 'query', -- OAuth2 Response Mode - how the authorization response is delivered
    code_challenge_method VARCHAR(50) DEFAULT 'S256', -- PKCE Code Challenge Method - method for generating code challenges
    
    -- Flexible Configuration
    supported_claims JSONB DEFAULT '{}', -- Supported Claims - JSON schema of claims this provider supports
    provider_metadata JSONB DEFAULT '{}', -- Provider Metadata - provider-specific configuration and settings
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraints for multiple provider support
    UNIQUE (system_name, provider_instance_id), -- Support multiple instances of same provider type
    UNIQUE (provider_type, is_default_for_type) WHERE is_default_for_type = TRUE -- Only one default per provider type
);

-- OIDC provider-agnostic user identity mappings - all provider-specific data stored in provider_metadata JSONB field
CREATE TABLE user_ciam_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ciam_identifier VARCHAR(255) NOT NULL, -- OIDC 'sub' claim
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(app_user_id, ciam_identifier, ciam_system)
);

-- Secure storage for OIDC tokens with metadata
CREATE TABLE oidc_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique token record identifier
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Reference to user
    ciam_system_id UUID NOT NULL REFERENCES ciam_systems(id) ON DELETE CASCADE, -- Reference to CIAM system
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh', 'id')), -- Type of token
    token_hash VARCHAR(255) NOT NULL, -- Hashed token for security (never store plain tokens)
    token_metadata JSONB DEFAULT '{}', -- Token claims, expiry, scope, etc.
    expires_at TIMESTAMP WITH TIME ZONE, -- When the token expires
    
    -- Provider instance information for token validation
    token_issuer VARCHAR(255), -- JWT token issuer URL for validation
    provider_instance_id VARCHAR(255), -- Provider instance identifier for quick lookup
    token_audience VARCHAR(255), -- JWT token audience for validation
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ciam_system_id, token_type) -- One token per type per user per system
);

-- OIDC session management with state and PKCE support
CREATE TABLE oidc_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique session record identifier
    session_id VARCHAR(255) NOT NULL UNIQUE, -- Unique session identifier
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Reference to user (nullable for anonymous sessions)
    ciam_system_id UUID NOT NULL REFERENCES ciam_systems(id) ON DELETE CASCADE, -- Reference to CIAM system
    state VARCHAR(255) NOT NULL, -- OAuth2 state parameter for CSRF protection
    code_verifier VARCHAR(255), -- PKCE code verifier for enhanced security
    return_url TEXT, -- Return URL after authentication
    session_data JSONB DEFAULT '{}', -- Additional session data and metadata
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When session expires
    
    -- Provider instance information for session management
    provider_instance_id VARCHAR(255), -- Provider instance identifier for quick lookup
    provider_environment VARCHAR(50), -- Provider environment for audit and debugging
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Create schema_migrations table for tracking applied migrations
CREATE TABLE schema_migrations (
    version BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Customer indexes
CREATE INDEX idx_customers_status ON customers (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers (email) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_status_subscription ON customers (status, subscription_status);

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

-- Insert records for all migrations
INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(1, 'initial_schema', 'initial_schema_v1_0', 'success'),
(2, 'cognito_ciam_support', 'cognito_ciam_support_v1_0', 'success'),
(3, 'oidc_agnostic_ciam_support', 'oidc_agnostic_ciam_support_v1_0', 'success'),
(4, 'remove_cognito_backward_compatibility', 'remove_cognito_backward_compatibility_v1_0', 'success'),
(5, 'support_multiple_providers_same_type', 'support_multiple_providers_same_type_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;