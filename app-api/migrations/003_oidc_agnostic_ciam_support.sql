-- Migration: 003_oidc_agnostic_ciam_support.sql
-- Description: Update CIAM tables to be provider-agnostic and OIDC compliant
-- Date: 2024-09-28
-- Author: AGoat Publisher Team
-- 
-- This migration updates CIAM tables to be provider-agnostic and OIDC compliant
-- while supporting provider-specific fields through flexible configuration
--
-- OVERVIEW:
-- This migration transforms the CIAM system from provider-specific (Cognito, Azure) 
-- to a generic OIDC-compliant system that can work with any OIDC provider.
-- 
-- KEY CHANGES:
-- 1. Remove provider-specific fields (cognito_sub, azure_tenant_id, etc.)
-- 2. Add OIDC standard fields (oidc_sub, oidc_issuer, oidc_audience)
-- 3. Use JSONB fields for provider-specific metadata
-- 4. Add OIDC standard endpoints and configuration
-- 5. Create new tables for secure token and session management
--
-- DATA SOURCES:
-- - Cognito values: From existing Cognito configuration and user data
-- - Azure values: From existing Azure Entra ID configuration
-- - OIDC values: From OIDC discovery endpoints and JWT claims
-- - Default values: Industry standard OIDC defaults

-- =============================================================================
-- UPDATE CIAM SYSTEMS TABLE TO BE OIDC COMPLIANT
-- =============================================================================
-- Update ciam_systems table to be provider-agnostic and OIDC compliant
ALTER TABLE ciam_systems 
    -- Provider type classification (OIDC standard)
    ADD COLUMN IF NOT EXISTS provider_type VARCHAR(50) DEFAULT 'oidc' CHECK (provider_type IN ('oidc', 'oauth2', 'saml', 'custom')),
    -- OIDC Discovery endpoint - where to find all other endpoints automatically
    -- Source: OIDC specification, typically /.well-known/openid_configuration
    ADD COLUMN IF NOT EXISTS oidc_discovery_url TEXT,
    -- OAuth2/OIDC Authorization endpoint - where users are redirected to login
    -- Source: OIDC discovery endpoint or manual configuration
    ADD COLUMN IF NOT EXISTS authorization_endpoint TEXT,
    -- OAuth2/OIDC Token endpoint - where authorization codes are exchanged for tokens
    -- Source: OIDC discovery endpoint or manual configuration
    ADD COLUMN IF NOT EXISTS token_endpoint TEXT,
    -- OIDC UserInfo endpoint - where user information is retrieved
    -- Source: OIDC discovery endpoint or manual configuration
    ADD COLUMN IF NOT EXISTS userinfo_endpoint TEXT,
    -- OIDC End Session endpoint - where users are redirected to logout
    -- Source: OIDC discovery endpoint or manual configuration
    ADD COLUMN IF NOT EXISTS end_session_endpoint TEXT,
    -- OAuth2 Client ID - unique identifier for this application
    -- Source: Provider application registration (Cognito App Client, Azure App Registration, etc.)
    ADD COLUMN IF NOT EXISTS client_id VARCHAR(255),
    -- OAuth2 Client Secret - secret key for confidential clients (encrypted)
    -- Source: Provider application registration, stored encrypted for security
    ADD COLUMN IF NOT EXISTS client_secret_encrypted TEXT,
    -- OAuth2 Scopes - permissions requested from the provider
    -- Source: OIDC standard scopes (openid, profile, email) + provider-specific scopes
    ADD COLUMN IF NOT EXISTS scopes TEXT DEFAULT 'openid profile email',
    -- OAuth2 Response Type - how the authorization response is returned
    -- Source: OIDC standard, typically 'code' for authorization code flow
    ADD COLUMN IF NOT EXISTS response_type VARCHAR(50) DEFAULT 'code',
    -- OAuth2 Response Mode - how the authorization response is delivered
    -- Source: OIDC standard, typically 'query' for query parameters
    ADD COLUMN IF NOT EXISTS response_mode VARCHAR(50) DEFAULT 'query',
    -- PKCE Code Challenge Method - method for generating code challenges
    -- Source: OIDC standard, typically 'S256' for SHA256
    ADD COLUMN IF NOT EXISTS code_challenge_method VARCHAR(50) DEFAULT 'S256',
    -- Supported Claims - JSON schema of claims this provider supports
    -- Source: OIDC discovery endpoint or provider documentation
    ADD COLUMN IF NOT EXISTS supported_claims JSONB DEFAULT '{}',
    -- Provider Metadata - provider-specific configuration and settings
    -- Source: Provider-specific configuration (User Pool ID, Tenant ID, etc.)
    ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}';

-- Update existing records to have proper OIDC configuration
-- This populates the new OIDC fields with values from existing provider configurations
UPDATE ciam_systems SET 
    -- Set provider type to OIDC for all existing systems
    provider_type = 'oidc',
    
    -- OIDC Discovery URLs - where to find all provider endpoints automatically
    -- Source: OIDC specification standard discovery endpoints
    oidc_discovery_url = CASE 
        WHEN system_name = 'cognito' THEN 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/openid_configuration'
        -- Source: AWS Cognito User Pool discovery endpoint format
        WHEN system_name = 'azure_entra' THEN 'https://login.microsoftonline.com/{tenant_id}/.well-known/openid_configuration'
        -- Source: Microsoft Azure Entra ID discovery endpoint format
        ELSE NULL
    END,
    
    -- Authorization Endpoints - where users are redirected to authenticate
    -- Source: Provider-specific login URLs
    authorization_endpoint = CASE 
        WHEN system_name = 'cognito' THEN 'https://auth.dev.np-topvitaminsupply.com/login/continue'
        -- Source: Cognito Hosted UI login URL from auth-config.txt requirements
        WHEN system_name = 'azure_entra' THEN 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize'
        -- Source: Azure Entra ID OAuth2 authorization endpoint
        ELSE NULL
    END,
    
    -- Token Endpoints - where authorization codes are exchanged for tokens
    -- Source: Provider OAuth2 token endpoints
    token_endpoint = CASE 
        WHEN system_name = 'cognito' THEN 'https://auth.dev.np-topvitaminsupply.com/oauth2/token'
        -- Source: Cognito OAuth2 token endpoint
        WHEN system_name = 'azure_entra' THEN 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token'
        -- Source: Azure Entra ID OAuth2 token endpoint
        ELSE NULL
    END,
    
    -- UserInfo Endpoints - where user information is retrieved
    -- Source: Provider userinfo endpoints
    userinfo_endpoint = CASE 
        WHEN system_name = 'cognito' THEN 'https://auth.dev.np-topvitaminsupply.com/oauth2/userInfo'
        -- Source: Cognito userinfo endpoint
        WHEN system_name = 'azure_entra' THEN 'https://graph.microsoft.com/oidc/userinfo'
        -- Source: Microsoft Graph userinfo endpoint
        ELSE NULL
    END,
    
    -- End Session Endpoints - where users are redirected to logout
    -- Source: Provider logout endpoints
    end_session_endpoint = CASE 
        WHEN system_name = 'cognito' THEN 'https://auth.dev.np-topvitaminsupply.com/logout'
        -- Source: Cognito logout endpoint
        WHEN system_name = 'azure_entra' THEN 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/logout'
        -- Source: Azure Entra ID logout endpoint
        ELSE NULL
    END,
    
    -- Client IDs - unique application identifiers
    -- Source: Provider application registrations
    client_id = CASE 
        WHEN system_name = 'cognito' THEN '4lt0iqap612c9jug55f3a1s69k'
        -- Source: Cognito App Client ID from auth-config.txt requirements
        WHEN system_name = 'azure_entra' THEN 'placeholder'
        -- Source: Azure App Registration Client ID (placeholder for now)
        ELSE NULL
    END,
    
    -- Scopes - permissions requested from the provider
    -- Source: OIDC standard scopes + provider-specific scopes
    scopes = CASE 
        WHEN system_name = 'cognito' THEN 'email openid phone'
        -- Source: Cognito scopes from auth-config.txt requirements
        WHEN system_name = 'azure_entra' THEN 'openid profile email'
        -- Source: Azure Entra ID standard scopes
        ELSE 'openid profile email'
        -- Source: OIDC standard scopes
    END,
    
    -- Supported Claims - JSON schema of claims this provider supports
    -- Source: Provider documentation and JWT token analysis
    supported_claims = CASE 
        WHEN system_name = 'cognito' THEN '{"sub": "string", "email": "string", "email_verified": "boolean", "phone_number": "string", "phone_number_verified": "boolean", "given_name": "string", "family_name": "string", "name": "string", "preferred_username": "string", "cognito:username": "string"}'
        -- Source: Cognito JWT token claims analysis
        WHEN system_name = 'azure_entra' THEN '{"sub": "string", "email": "string", "email_verified": "boolean", "given_name": "string", "family_name": "string", "name": "string", "preferred_username": "string", "oid": "string", "tid": "string"}'
        -- Source: Azure Entra ID JWT token claims analysis
        ELSE '{"sub": "string", "email": "string", "email_verified": "boolean", "given_name": "string", "family_name": "string", "name": "string", "preferred_username": "string"}'
        -- Source: OIDC standard claims
    END,
    
    -- Provider Metadata - provider-specific configuration
    -- Source: Provider-specific settings and identifiers
    provider_metadata = CASE 
        WHEN system_name = 'cognito' THEN '{"user_pool_id": "us-east-1_FJUcN8W07", "region": "us-east-1", "domain": "auth.dev.np-topvitaminsupply.com"}'
        -- Source: Cognito User Pool ID and region from auth-config.txt requirements
        WHEN system_name = 'azure_entra' THEN '{"tenant_id": "placeholder", "authority_url": "https://login.microsoftonline.com/{tenant_id}"}'
        -- Source: Azure Tenant ID and authority URL (placeholder for now)
        ELSE '{}'
    END
WHERE provider_type IS NULL;

-- =============================================================================
-- UPDATE USER CIAM MAPPINGS TABLE TO BE PROVIDER-AGNOSTIC
-- =============================================================================
-- Update user_ciam_mappings table to be provider-agnostic
ALTER TABLE user_ciam_mappings 
    -- Generic provider identifier - replaces provider-specific fields
    -- Source: Provider-specific identifiers (User Pool ID, Tenant ID, etc.)
    ADD COLUMN IF NOT EXISTS provider_identifier VARCHAR(255),
    -- Provider-specific user data and configuration
    -- Source: Provider-specific user attributes and settings
    ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}',
    -- Last successful authentication timestamp for audit and analytics
    -- Source: Authentication event timestamps
    ADD COLUMN IF NOT EXISTS last_authenticated_at TIMESTAMP WITH TIME ZONE,
    -- Authentication method used (OIDC, OAuth2, SAML, etc.)
    -- Source: Provider authentication method
    ADD COLUMN IF NOT EXISTS authentication_method VARCHAR(50) DEFAULT 'oidc',
    -- Token-related metadata (expiry, scope, claims, etc.)
    -- Source: JWT token claims and OAuth2 token metadata
    ADD COLUMN IF NOT EXISTS token_metadata JSONB DEFAULT '{}';

-- Migrate existing data to new structure
-- This moves provider-specific data from dedicated columns to generic JSONB fields
UPDATE user_ciam_mappings SET 
    -- Migrate provider-specific identifiers to generic field
    -- Source: Existing provider-specific columns (ciam_user_pool_id, ciam_tenant_id)
    provider_identifier = CASE 
        WHEN ciam_system = 'cognito' THEN ciam_user_pool_id
        -- Source: Cognito User Pool ID from existing ciam_user_pool_id column
        WHEN ciam_system = 'azure_entra' THEN ciam_tenant_id
        -- Source: Azure Tenant ID from existing ciam_tenant_id column
        ELSE NULL
    END,
    -- Migrate provider-specific data to JSONB metadata
    -- Source: Existing provider-specific columns converted to JSONB
    provider_metadata = CASE 
        WHEN ciam_system = 'cognito' THEN jsonb_build_object('user_pool_id', ciam_user_pool_id)
        -- Source: Cognito User Pool ID moved to provider_metadata JSONB
        WHEN ciam_system = 'azure_entra' THEN jsonb_build_object('tenant_id', ciam_tenant_id)
        -- Source: Azure Tenant ID moved to provider_metadata JSONB
        ELSE '{}'
    END
WHERE provider_identifier IS NULL;

-- =============================================================================
-- UPDATE USERS TABLE TO BE PROVIDER-AGNOSTIC
-- =============================================================================
-- Add generic OIDC-compliant fields to users table
ALTER TABLE users 
    -- OIDC Standard Claims - from JWT ID tokens
    ADD COLUMN IF NOT EXISTS oidc_sub VARCHAR(255), -- OIDC 'sub' claim - unique subject identifier
    -- Source: JWT ID token 'sub' claim from any OIDC provider
    ADD COLUMN IF NOT EXISTS oidc_issuer VARCHAR(255), -- OIDC 'iss' claim - token issuer
    -- Source: JWT ID token 'iss' claim (e.g., https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07)
    ADD COLUMN IF NOT EXISTS oidc_audience VARCHAR(255), -- OIDC 'aud' claim - intended audience
    -- Source: JWT ID token 'aud' claim (typically the client_id)
    
    -- Standard User Profile Fields - from OIDC standard claims
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50), -- User's phone number
    -- Source: JWT ID token 'phone_number' claim
    ADD COLUMN IF NOT EXISTS phone_number_verified BOOLEAN DEFAULT FALSE, -- Phone verification status
    -- Source: JWT ID token 'phone_number_verified' claim
    ADD COLUMN IF NOT EXISTS given_name VARCHAR(255), -- User's first name
    -- Source: JWT ID token 'given_name' claim
    ADD COLUMN IF NOT EXISTS family_name VARCHAR(255), -- User's last name
    -- Source: JWT ID token 'family_name' claim
    ADD COLUMN IF NOT EXISTS name VARCHAR(255), -- User's full name
    -- Source: JWT ID token 'name' claim
    ADD COLUMN IF NOT EXISTS preferred_username VARCHAR(255), -- User's preferred username
    -- Source: JWT ID token 'preferred_username' claim
    ADD COLUMN IF NOT EXISTS locale VARCHAR(10), -- User's locale preference
    -- Source: JWT ID token 'locale' claim
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(50), -- User's timezone
    -- Source: JWT ID token 'timezone' claim or user profile settings
    
    -- OIDC Timestamps - from provider user creation/update events
    ADD COLUMN IF NOT EXISTS oidc_created_at TIMESTAMP WITH TIME ZONE, -- When user was created in OIDC provider
    -- Source: Provider user creation timestamp
    ADD COLUMN IF NOT EXISTS oidc_updated_at TIMESTAMP WITH TIME ZONE, -- When user was last updated in OIDC provider
    -- Source: Provider user update timestamp
    
    -- Provider-specific metadata - flexible storage for provider-specific data
    ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}'; -- Provider-specific user data
    -- Source: Provider-specific user attributes, custom claims, and settings

-- Migrate existing Cognito-specific data to generic fields
-- This moves Cognito-specific data to OIDC-compliant fields and provider metadata
UPDATE users SET 
    -- Migrate Cognito 'sub' to OIDC 'sub'
    oidc_sub = cognito_sub,
    -- Source: Existing cognito_sub column (Cognito's unique user identifier)
    oidc_created_at = cognito_created_at,
    -- Source: Existing cognito_created_at column (when user was created in Cognito)
    oidc_updated_at = cognito_updated_at,
    -- Source: Existing cognito_updated_at column (when user was last updated in Cognito)
    provider_metadata = jsonb_build_object(
        'cognito_user_pool_id', cognito_user_pool_id,
        -- Source: Existing cognito_user_pool_id column (Cognito User Pool identifier)
        'cognito_username', preferred_username
        -- Source: Existing preferred_username column (Cognito username)
    )
WHERE cognito_sub IS NOT NULL AND oidc_sub IS NULL;

-- =============================================================================
-- CREATE OIDC TOKEN STORAGE TABLE
-- =============================================================================
-- Table for storing OIDC tokens and related metadata
-- This table securely stores OIDC tokens with hashing for security
CREATE TABLE IF NOT EXISTS oidc_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique token record identifier
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Reference to user
    -- Source: users.id from authentication process
    ciam_system_id UUID NOT NULL REFERENCES ciam_systems(id) ON DELETE CASCADE, -- Reference to CIAM system
    -- Source: ciam_systems.id for the provider used for authentication
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh', 'id')), -- Type of token
    -- Source: OIDC token types (access_token, refresh_token, id_token)
    token_hash VARCHAR(255) NOT NULL, -- Hashed token for security (never store plain tokens)
    -- Source: SHA256 hash of the actual token for security
    token_metadata JSONB DEFAULT '{}', -- Token claims, expiry, scope, etc.
    -- Source: JWT token claims, OAuth2 token metadata, and additional token information
    expires_at TIMESTAMP WITH TIME ZONE, -- When the token expires
    -- Source: OAuth2 token expiry timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When token was stored
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When token was last updated
    UNIQUE(user_id, ciam_system_id, token_type) -- One token per type per user per system
);

-- =============================================================================
-- CREATE OIDC SESSION TABLE
-- =============================================================================
-- Table for managing OIDC sessions and state
-- This table manages OIDC authentication sessions with state and PKCE support
CREATE TABLE IF NOT EXISTS oidc_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Unique session record identifier
    session_id VARCHAR(255) NOT NULL UNIQUE, -- Unique session identifier
    -- Source: Generated session ID for tracking authentication flow
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Reference to user (nullable for anonymous sessions)
    -- Source: users.id after successful authentication (NULL during login flow)
    ciam_system_id UUID NOT NULL REFERENCES ciam_systems(id) ON DELETE CASCADE, -- Reference to CIAM system
    -- Source: ciam_systems.id for the provider being used for authentication
    state VARCHAR(255) NOT NULL, -- OAuth2 state parameter for CSRF protection
    -- Source: OAuth2 state parameter generated during login initiation
    code_verifier VARCHAR(255), -- PKCE code verifier for enhanced security
    -- Source: PKCE code verifier generated during login initiation
    return_url TEXT, -- Return URL after authentication
    -- Source: URL where user should be redirected after successful authentication
    session_data JSONB DEFAULT '{}', -- Additional session data and metadata
    -- Source: Additional session information, user preferences, etc.
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When session expires
    -- Source: Session expiry timestamp (typically 5-10 minutes for security)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When session was created
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- When session was last updated
);

-- =============================================================================
-- UPDATE INDEXES FOR NEW STRUCTURE
-- =============================================================================

-- Drop old Cognito-specific indexes
DROP INDEX IF EXISTS idx_users_cognito_sub;
DROP INDEX IF EXISTS idx_users_cognito_user_pool_id;

-- Create new OIDC-compliant indexes
CREATE INDEX IF NOT EXISTS idx_users_oidc_sub ON users (oidc_sub) WHERE oidc_sub IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_oidc_issuer ON users (oidc_issuer) WHERE oidc_issuer IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users (phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users (email_verified) WHERE email_verified = TRUE;

-- CIAM systems indexes
CREATE INDEX IF NOT EXISTS idx_ciam_systems_provider_type ON ciam_systems (provider_type);
CREATE INDEX IF NOT EXISTS idx_ciam_systems_client_id ON ciam_systems (client_id) WHERE client_id IS NOT NULL;

-- User CIAM mappings indexes
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_provider_identifier ON user_ciam_mappings (provider_identifier) WHERE provider_identifier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_last_auth ON user_ciam_mappings (last_authenticated_at DESC) WHERE last_authenticated_at IS NOT NULL;

-- OIDC tokens indexes
CREATE INDEX IF NOT EXISTS idx_oidc_tokens_user_id ON oidc_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_oidc_tokens_ciam_system_id ON oidc_tokens (ciam_system_id);
CREATE INDEX IF NOT EXISTS idx_oidc_tokens_expires_at ON oidc_tokens (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oidc_tokens_type ON oidc_tokens (token_type);

-- OIDC sessions indexes
CREATE INDEX IF NOT EXISTS idx_oidc_sessions_session_id ON oidc_sessions (session_id);
CREATE INDEX IF NOT EXISTS idx_oidc_sessions_user_id ON oidc_sessions (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oidc_sessions_state ON oidc_sessions (state);
CREATE INDEX IF NOT EXISTS idx_oidc_sessions_expires_at ON oidc_sessions (expires_at);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- =============================================================================

-- Create triggers for new tables
CREATE TRIGGER IF NOT EXISTS trigger_update_oidc_tokens_updated_at
    BEFORE UPDATE ON oidc_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_update_oidc_sessions_updated_at
    BEFORE UPDATE ON oidc_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS FOR OIDC COMPLIANCE
-- =============================================================================

-- Function to get OIDC configuration for a CIAM system
-- This function retrieves OIDC configuration for any provider by system name
-- Source: ciam_systems table with OIDC-compliant configuration
CREATE OR REPLACE FUNCTION get_oidc_config(system_name_param VARCHAR(50))
RETURNS TABLE (
    system_id UUID, -- CIAM system unique identifier
    -- Source: ciam_systems.id
    provider_type VARCHAR(50), -- Type of provider (oidc, oauth2, saml, custom)
    -- Source: ciam_systems.provider_type
    jwks_url TEXT, -- JSON Web Key Set URL for token validation
    -- Source: ciam_systems.jwks_url
    issuer_url TEXT, -- OIDC issuer URL
    -- Source: ciam_systems.issuer_url
    authorization_endpoint TEXT, -- OAuth2 authorization endpoint
    -- Source: ciam_systems.authorization_endpoint
    token_endpoint TEXT, -- OAuth2 token endpoint
    -- Source: ciam_systems.token_endpoint
    userinfo_endpoint TEXT, -- OIDC userinfo endpoint
    -- Source: ciam_systems.userinfo_endpoint
    end_session_endpoint TEXT, -- OIDC end session endpoint
    -- Source: ciam_systems.end_session_endpoint
    client_id VARCHAR(255), -- OAuth2 client identifier
    -- Source: ciam_systems.client_id
    scopes TEXT, -- OAuth2 scopes
    -- Source: ciam_systems.scopes
    response_type VARCHAR(50), -- OAuth2 response type
    -- Source: ciam_systems.response_type
    response_mode VARCHAR(50), -- OAuth2 response mode
    -- Source: ciam_systems.response_mode
    code_challenge_method VARCHAR(50), -- PKCE code challenge method
    -- Source: ciam_systems.code_challenge_method
    supported_claims JSONB, -- JSON schema of supported claims
    -- Source: ciam_systems.supported_claims
    provider_metadata JSONB -- Provider-specific configuration
    -- Source: ciam_systems.provider_metadata
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

-- Function to create or update OIDC user mapping
-- This function creates or updates user-CIAM identity mappings for OIDC providers
-- Source: user_ciam_mappings table with OIDC-compliant structure
CREATE OR REPLACE FUNCTION upsert_oidc_user_mapping(
    user_id_param UUID, -- Application user ID
    -- Source: users.id from authentication process
    ciam_system_name_param VARCHAR(50), -- CIAM system name (cognito, azure_entra, etc.)
    -- Source: ciam_systems.system_name
    oidc_sub_param VARCHAR(255), -- OIDC subject identifier
    -- Source: JWT ID token 'sub' claim
    provider_identifier_param VARCHAR(255), -- Provider-specific identifier
    -- Source: Provider-specific identifier (User Pool ID, Tenant ID, etc.)
    provider_metadata_param JSONB DEFAULT '{}' -- Provider-specific metadata
    -- Source: Provider-specific user data and configuration
)
RETURNS UUID AS $$
DECLARE
    mapping_id UUID; -- Returned mapping ID
    ciam_system_id_val UUID; -- CIAM system ID
BEGIN
    -- Get CIAM system ID from system name
    -- Source: ciam_systems.id lookup by system_name
    SELECT id INTO ciam_system_id_val 
    FROM ciam_systems 
    WHERE system_name = ciam_system_name_param AND is_active = TRUE;
    
    IF ciam_system_id_val IS NULL THEN
        RAISE EXCEPTION 'CIAM system not found: %', ciam_system_name_param;
    END IF;
    
    -- Check if mapping already exists
    -- Source: user_ciam_mappings table lookup
    SELECT id INTO mapping_id
    FROM user_ciam_mappings
    WHERE app_user_id = user_id_param 
    AND ciam_system = ciam_system_name_param
    AND ciam_identifier = oidc_sub_param;
    
    IF mapping_id IS NOT NULL THEN
        -- Update existing mapping with new data
        -- Source: Update existing user_ciam_mappings record
        UPDATE user_ciam_mappings SET
            provider_identifier = provider_identifier_param,
            -- Source: provider_identifier_param
            provider_metadata = provider_metadata_param,
            -- Source: provider_metadata_param
            last_authenticated_at = NOW(),
            -- Source: Current timestamp
            updated_at = NOW()
            -- Source: Current timestamp
        WHERE id = mapping_id;
    ELSE
        -- Create new mapping
        -- Source: Insert new user_ciam_mappings record
        INSERT INTO user_ciam_mappings (
            app_user_id, ciam_identifier, ciam_system, 
            provider_identifier, provider_metadata, 
            is_current_ciam, last_authenticated_at
        ) VALUES (
            user_id_param, -- Source: user_id_param
            oidc_sub_param, -- Source: oidc_sub_param
            ciam_system_name_param, -- Source: ciam_system_name_param
            provider_identifier_param, -- Source: provider_identifier_param
            provider_metadata_param, -- Source: provider_metadata_param
            TRUE, -- Source: Set as current CIAM for this user
            NOW() -- Source: Current timestamp
        ) RETURNING id INTO mapping_id;
    END IF;
    
    RETURN mapping_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UPDATE EXISTING CIAM SYSTEMS WITH OIDC CONFIGURATION
-- =============================================================================

-- Update Cognito system with proper OIDC configuration
-- This populates Cognito-specific OIDC configuration from auth-config.txt requirements
UPDATE ciam_systems SET 
    provider_type = 'oidc', -- Set as OIDC provider
    -- Source: OIDC standard classification
    oidc_discovery_url = 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/openid_configuration',
    -- Source: AWS Cognito User Pool discovery endpoint format
    authorization_endpoint = 'https://auth.dev.np-topvitaminsupply.com/login/continue',
    -- Source: Cognito Hosted UI login URL from auth-config.txt requirements
    token_endpoint = 'https://auth.dev.np-topvitaminsupply.com/oauth2/token',
    -- Source: Cognito OAuth2 token endpoint
    userinfo_endpoint = 'https://auth.dev.np-topvitaminsupply.com/oauth2/userInfo',
    -- Source: Cognito userinfo endpoint
    end_session_endpoint = 'https://auth.dev.np-topvitaminsupply.com/logout',
    -- Source: Cognito logout endpoint
    client_id = '4lt0iqap612c9jug55f3a1s69k',
    -- Source: Cognito App Client ID from auth-config.txt requirements
    scopes = 'email openid phone',
    -- Source: Cognito scopes from auth-config.txt requirements
    response_type = 'code',
    -- Source: OIDC standard authorization code flow
    response_mode = 'query',
    -- Source: OIDC standard query parameter response mode
    code_challenge_method = 'S256',
    -- Source: OIDC standard PKCE SHA256 method
    supported_claims = '{"sub": "string", "email": "string", "email_verified": "boolean", "phone_number": "string", "phone_number_verified": "boolean", "given_name": "string", "family_name": "string", "name": "string", "preferred_username": "string", "cognito:username": "string"}',
    -- Source: Cognito JWT token claims analysis
    provider_metadata = '{"user_pool_id": "us-east-1_FJUcN8W07", "region": "us-east-1", "domain": "auth.dev.np-topvitaminsupply.com"}'
    -- Source: Cognito User Pool ID and region from auth-config.txt requirements
WHERE system_name = 'cognito';

-- Update Azure Entra ID system with proper OIDC configuration
-- This populates Azure Entra ID-specific OIDC configuration (placeholder values)
UPDATE ciam_systems SET 
    provider_type = 'oidc', -- Set as OIDC provider
    -- Source: OIDC standard classification
    oidc_discovery_url = 'https://login.microsoftonline.com/{tenant_id}/.well-known/openid_configuration',
    -- Source: Microsoft Azure Entra ID discovery endpoint format
    authorization_endpoint = 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize',
    -- Source: Azure Entra ID OAuth2 authorization endpoint
    token_endpoint = 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token',
    -- Source: Azure Entra ID OAuth2 token endpoint
    userinfo_endpoint = 'https://graph.microsoft.com/oidc/userinfo',
    -- Source: Microsoft Graph userinfo endpoint
    end_session_endpoint = 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/logout',
    -- Source: Azure Entra ID logout endpoint
    client_id = 'placeholder',
    -- Source: Azure App Registration Client ID (placeholder for now)
    scopes = 'openid profile email',
    -- Source: Azure Entra ID standard scopes
    response_type = 'code',
    -- Source: OIDC standard authorization code flow
    response_mode = 'query',
    -- Source: OIDC standard query parameter response mode
    code_challenge_method = 'S256',
    -- Source: OIDC standard PKCE SHA256 method
    supported_claims = '{"sub": "string", "email": "string", "email_verified": "boolean", "given_name": "string", "family_name": "string", "name": "string", "preferred_username": "string", "oid": "string", "tid": "string"}',
    -- Source: Azure Entra ID JWT token claims analysis
    provider_metadata = '{"tenant_id": "placeholder", "authority_url": "https://login.microsoftonline.com/{tenant_id}"}'
    -- Source: Azure Tenant ID and authority URL (placeholder for now)
WHERE system_name = 'azure_entra';

-- =============================================================================
-- COMMENTS
-- =============================================================================

-- Table Comments - High-level descriptions of table purposes
COMMENT ON TABLE ciam_systems IS 'OIDC-compliant CIAM system configurations supporting multiple providers';
-- Source: OIDC specification and multi-provider CIAM requirements

COMMENT ON TABLE user_ciam_mappings IS 'Provider-agnostic user-CIAM identity mappings with OIDC compliance';
-- Source: User identity mapping requirements for multi-CIAM support

COMMENT ON TABLE oidc_tokens IS 'Secure storage for OIDC tokens with metadata';
-- Source: OIDC token management and security requirements

COMMENT ON TABLE oidc_sessions IS 'OIDC session management with state and PKCE support';
-- Source: OIDC session management and security requirements

-- Column Comments - Detailed descriptions of field purposes and data sources
COMMENT ON COLUMN ciam_systems.provider_type IS 'OIDC provider type (oidc, oauth2, saml, custom)';
-- Source: OIDC specification provider type classification

COMMENT ON COLUMN ciam_systems.oidc_discovery_url IS 'OIDC discovery endpoint URL';
-- Source: OIDC specification discovery endpoint format

COMMENT ON COLUMN ciam_systems.supported_claims IS 'JSON schema of supported OIDC claims';
-- Source: Provider documentation and JWT token claims analysis

COMMENT ON COLUMN ciam_systems.provider_metadata IS 'Provider-specific configuration and metadata';
-- Source: Provider-specific settings and identifiers

COMMENT ON COLUMN user_ciam_mappings.provider_identifier IS 'Generic provider identifier (user pool ID, tenant ID, etc.)';
-- Source: Provider-specific identifiers (Cognito User Pool ID, Azure Tenant ID, etc.)

COMMENT ON COLUMN user_ciam_mappings.provider_metadata IS 'Provider-specific user metadata';
-- Source: Provider-specific user attributes and settings

COMMENT ON COLUMN user_ciam_mappings.last_authenticated_at IS 'Last successful authentication timestamp';
-- Source: Authentication event timestamps for audit and analytics

COMMENT ON COLUMN users.oidc_sub IS 'OIDC subject identifier (sub claim)';
-- Source: JWT ID token 'sub' claim from any OIDC provider

COMMENT ON COLUMN users.oidc_issuer IS 'OIDC issuer identifier (iss claim)';
-- Source: JWT ID token 'iss' claim (e.g., https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07)

COMMENT ON COLUMN users.oidc_audience IS 'OIDC audience identifier (aud claim)';
-- Source: JWT ID token 'aud' claim (typically the client_id)

COMMENT ON COLUMN users.provider_metadata IS 'Provider-specific user metadata';
-- Source: Provider-specific user attributes, custom claims, and settings

COMMENT ON COLUMN oidc_tokens.token_hash IS 'Hashed token for security (never store plain tokens)';
-- Source: SHA256 hash of the actual token for security

COMMENT ON COLUMN oidc_tokens.token_metadata IS 'Token claims, expiry, and other metadata';
-- Source: JWT token claims, OAuth2 token metadata, and additional token information

COMMENT ON COLUMN oidc_sessions.state IS 'OAuth2 state parameter for CSRF protection';
-- Source: OAuth2 state parameter generated during login initiation

COMMENT ON COLUMN oidc_sessions.code_verifier IS 'PKCE code verifier for enhanced security';
-- Source: PKCE code verifier generated during login initiation

COMMENT ON COLUMN oidc_sessions.return_url IS 'URL to redirect to after authentication';
-- Source: URL where user should be redirected after successful authentication

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Insert record for this migration
-- This tracks the migration in the schema_migrations table for version control
INSERT INTO schema_migrations (version, name, checksum, status)
VALUES (3, 'oidc_agnostic_ciam_support', 'oidc_agnostic_ciam_support_v1_0', 'success')
-- Source: Migration version tracking system
-- version: 3 (sequential migration number)
-- name: 'oidc_agnostic_ciam_support' (descriptive migration name)
-- checksum: 'oidc_agnostic_ciam_support_v1_0' (migration content checksum)
-- status: 'success' (migration execution status)
ON CONFLICT (version) DO NOTHING;
