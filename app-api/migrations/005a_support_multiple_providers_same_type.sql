-- Migration: 005_support_multiple_providers_same_type.sql
-- Description: Support multiple providers of the same type with unique identifiers for specific instances/environments/pools
-- Date: 2024-09-28
-- Author: AGoat Publisher Team
-- 
-- This migration enables support for multiple providers of the same type (e.g., multiple Cognito User Pools,
-- multiple Azure Tenants, multiple Auth0 applications) by adding unique identifiers for specific instances.
-- The unique identifier is obtained from JWT tokens and stored in the ciam_systems table.

-- =============================================================================
-- UPDATE CIAM_SYSTEMS TABLE TO SUPPORT MULTIPLE PROVIDERS OF SAME TYPE
-- =============================================================================
-- Add fields to support multiple instances of the same provider type

-- Add provider instance identifier - unique identifier for specific instance/environment/pool
ALTER TABLE ciam_systems 
    ADD COLUMN IF NOT EXISTS provider_instance_id VARCHAR(255) NOT NULL DEFAULT 'default',
    -- Source: JWT token 'iss' claim (issuer URL) or provider-specific identifier
    -- Examples: 
    -- - Cognito: User Pool ID (us-east-1_FJUcN8W07) from 'iss' claim
    -- - Azure: Tenant ID from 'iss' claim or 'tid' claim
    -- - Auth0: Domain from 'iss' claim
    
    ADD COLUMN IF NOT EXISTS provider_environment VARCHAR(50) DEFAULT 'production',
    -- Source: Environment context (production, staging, development, etc.)
    -- Examples: 'production', 'staging', 'development', 'test'
    
    ADD COLUMN IF NOT EXISTS provider_region VARCHAR(50),
    -- Source: Provider region information
    -- Examples: 'us-east-1', 'us-west-2', 'europe-west-1'
    
    ADD COLUMN IF NOT EXISTS provider_domain VARCHAR(255),
    -- Source: Provider domain from 'iss' claim or configuration
    -- Examples: 'auth.dev.np-topvitaminsupply.com', 'login.microsoftonline.com', 'your-domain.auth0.com'
    
    ADD COLUMN IF NOT EXISTS is_default_for_type BOOLEAN DEFAULT FALSE;
    -- Indicates if this is the default provider for this provider_type

-- =============================================================================
-- UPDATE UNIQUE CONSTRAINTS
-- =============================================================================
-- Update unique constraints to support multiple providers of same type

-- Drop existing unique constraint on system_name
ALTER TABLE ciam_systems DROP CONSTRAINT IF EXISTS ciam_systems_system_name_key;

-- Add new unique constraint combining system_name and provider_instance_id
ALTER TABLE ciam_systems ADD CONSTRAINT ciam_systems_system_name_instance_unique 
    UNIQUE (system_name, provider_instance_id);

-- Add unique constraint to ensure only one default per provider type
ALTER TABLE ciam_systems ADD CONSTRAINT ciam_systems_default_per_type_unique 
    UNIQUE (provider_type, is_default_for_type) 
    WHERE is_default_for_type = TRUE;

-- =============================================================================
-- UPDATE USER_CIAM_MAPPINGS TABLE
-- =============================================================================
-- Update user_ciam_mappings to reference specific provider instances

-- Add reference to specific provider instance
ALTER TABLE user_ciam_mappings 
    ADD COLUMN IF NOT EXISTS ciam_system_id UUID REFERENCES ciam_systems(id) ON DELETE CASCADE,
    -- Direct reference to the specific CIAM system instance
    
    ADD COLUMN IF NOT EXISTS provider_instance_id VARCHAR(255),
    -- Provider instance identifier for quick lookup
    -- Source: Same as ciam_systems.provider_instance_id
    
    ADD COLUMN IF NOT EXISTS provider_environment VARCHAR(50),
    -- Provider environment for audit and debugging
    -- Source: Same as ciam_systems.provider_environment
    
    ADD COLUMN IF NOT EXISTS token_issuer VARCHAR(255);
    -- JWT token issuer URL for validation
    -- Source: JWT token 'iss' claim

-- =============================================================================
-- UPDATE OIDC_TOKENS TABLE
-- =============================================================================
-- Update oidc_tokens to reference specific provider instances

-- Add provider instance information for token validation
ALTER TABLE oidc_tokens 
    ADD COLUMN IF NOT EXISTS token_issuer VARCHAR(255),
    -- JWT token issuer URL for validation
    -- Source: JWT token 'iss' claim
    
    ADD COLUMN IF NOT EXISTS provider_instance_id VARCHAR(255),
    -- Provider instance identifier for quick lookup
    -- Source: Same as ciam_systems.provider_instance_id
    
    ADD COLUMN IF NOT EXISTS token_audience VARCHAR(255);
    -- JWT token audience for validation
    -- Source: JWT token 'aud' claim

-- =============================================================================
-- UPDATE OIDC_SESSIONS TABLE
-- =============================================================================
-- Update oidc_sessions to reference specific provider instances

-- Add provider instance information for session management
ALTER TABLE oidc_sessions 
    ADD COLUMN IF NOT EXISTS provider_instance_id VARCHAR(255),
    -- Provider instance identifier for quick lookup
    -- Source: Same as ciam_systems.provider_instance_id
    
    ADD COLUMN IF NOT EXISTS provider_environment VARCHAR(50);
    -- Provider environment for audit and debugging
    -- Source: Same as ciam_systems.provider_environment

-- =============================================================================
-- UPDATE EXISTING DATA
-- =============================================================================
-- Update existing CIAM systems with provider instance information

-- Update Cognito system with provider instance information
UPDATE ciam_systems SET 
    provider_instance_id = 'us-east-1_FJUcN8W07',
    -- Source: Cognito User Pool ID from JWT token 'iss' claim
    provider_environment = 'development',
    -- Source: Environment context
    provider_region = 'us-east-1',
    -- Source: AWS region from User Pool ID
    provider_domain = 'auth.dev.np-topvitaminsupply.com',
    -- Source: Cognito domain from configuration
    is_default_for_type = TRUE
WHERE system_name = 'cognito';

-- Update Azure Entra ID system with provider instance information
UPDATE ciam_systems SET 
    provider_instance_id = 'placeholder-tenant-id',
    -- Source: Azure Tenant ID from JWT token 'iss' claim or 'tid' claim
    provider_environment = 'development',
    -- Source: Environment context
    provider_region = 'global',
    -- Source: Azure global region
    provider_domain = 'login.microsoftonline.com',
    -- Source: Azure domain from JWT token 'iss' claim
    is_default_for_type = TRUE
WHERE system_name = 'azure_entra';

-- =============================================================================
-- UPDATE USER_CIAM_MAPPINGS WITH PROVIDER INSTANCE INFORMATION
-- =============================================================================
-- Update existing user_ciam_mappings with provider instance information

-- Update user_ciam_mappings with ciam_system_id references
UPDATE user_ciam_mappings SET 
    ciam_system_id = cs.id,
    provider_instance_id = cs.provider_instance_id,
    provider_environment = cs.provider_environment,
    token_issuer = cs.issuer_url
FROM ciam_systems cs
WHERE user_ciam_mappings.ciam_system = cs.system_name
AND user_ciam_mappings.ciam_system_id IS NULL;

-- =============================================================================
-- UPDATE OIDC_TOKENS WITH PROVIDER INSTANCE INFORMATION
-- =============================================================================
-- Update existing oidc_tokens with provider instance information

-- Update oidc_tokens with provider instance information
UPDATE oidc_tokens SET 
    token_issuer = cs.issuer_url,
    provider_instance_id = cs.provider_instance_id,
    token_audience = cs.client_id
FROM ciam_systems cs
WHERE oidc_tokens.ciam_system_id = cs.id
AND oidc_tokens.token_issuer IS NULL;

-- =============================================================================
-- UPDATE OIDC_SESSIONS WITH PROVIDER INSTANCE INFORMATION
-- =============================================================================
-- Update existing oidc_sessions with provider instance information

-- Update oidc_sessions with provider instance information
UPDATE oidc_sessions SET 
    provider_instance_id = cs.provider_instance_id,
    provider_environment = cs.provider_environment
FROM ciam_systems cs
WHERE oidc_sessions.ciam_system_id = cs.id
AND oidc_sessions.provider_instance_id IS NULL;

-- =============================================================================
-- ADD NEW INDEXES FOR MULTIPLE PROVIDER SUPPORT
-- =============================================================================

-- CIAM systems indexes for multiple provider support
CREATE INDEX IF NOT EXISTS idx_ciam_systems_provider_instance_id ON ciam_systems (provider_instance_id);
CREATE INDEX IF NOT EXISTS idx_ciam_systems_provider_environment ON ciam_systems (provider_environment);
CREATE INDEX IF NOT EXISTS idx_ciam_systems_provider_region ON ciam_systems (provider_region);
CREATE INDEX IF NOT EXISTS idx_ciam_systems_provider_domain ON ciam_systems (provider_domain);
CREATE INDEX IF NOT EXISTS idx_ciam_systems_default_for_type ON ciam_systems (provider_type, is_default_for_type) WHERE is_default_for_type = TRUE;

-- User CIAM mappings indexes for multiple provider support
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_ciam_system_id ON user_ciam_mappings (ciam_system_id);
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_provider_instance_id ON user_ciam_mappings (provider_instance_id);
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_provider_environment ON user_ciam_mappings (provider_environment);
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_token_issuer ON user_ciam_mappings (token_issuer);

-- OIDC tokens indexes for multiple provider support
CREATE INDEX IF NOT EXISTS idx_oidc_tokens_token_issuer ON oidc_tokens (token_issuer);
CREATE INDEX IF NOT EXISTS idx_oidc_tokens_provider_instance_id ON oidc_tokens (provider_instance_id);
CREATE INDEX IF NOT EXISTS idx_oidc_tokens_token_audience ON oidc_tokens (token_audience);

-- OIDC sessions indexes for multiple provider support
CREATE INDEX IF NOT EXISTS idx_oidc_sessions_provider_instance_id ON oidc_sessions (provider_instance_id);
CREATE INDEX IF NOT EXISTS idx_oidc_sessions_provider_environment ON oidc_sessions (provider_environment);

-- =============================================================================
-- UPDATE FUNCTIONS FOR MULTIPLE PROVIDER SUPPORT
-- =============================================================================

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

-- =============================================================================
-- ADD CONSTRAINTS FOR DATA INTEGRITY
-- =============================================================================

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
-- UPDATE COMMENTS
-- =============================================================================

-- Update table comments
COMMENT ON TABLE ciam_systems IS 'OIDC-compliant CIAM system configurations supporting multiple instances of the same provider type';

-- Update column comments
COMMENT ON COLUMN ciam_systems.provider_instance_id IS 'Unique identifier for specific provider instance/environment/pool - obtained from JWT token iss claim';
COMMENT ON COLUMN ciam_systems.provider_environment IS 'Provider environment context (production, staging, development, test, local)';
COMMENT ON COLUMN ciam_systems.provider_region IS 'Provider region information (us-east-1, us-west-2, europe-west-1, global)';
COMMENT ON COLUMN ciam_systems.provider_domain IS 'Provider domain from JWT token iss claim or configuration';
COMMENT ON COLUMN ciam_systems.is_default_for_type IS 'Indicates if this is the default provider for this provider_type';

COMMENT ON COLUMN user_ciam_mappings.ciam_system_id IS 'Direct reference to specific CIAM system instance';
COMMENT ON COLUMN user_ciam_mappings.provider_instance_id IS 'Provider instance identifier for quick lookup - same as ciam_systems.provider_instance_id';
COMMENT ON COLUMN user_ciam_mappings.provider_environment IS 'Provider environment for audit and debugging';
COMMENT ON COLUMN user_ciam_mappings.token_issuer IS 'JWT token issuer URL for validation - obtained from JWT token iss claim';

COMMENT ON COLUMN oidc_tokens.token_issuer IS 'JWT token issuer URL for validation - obtained from JWT token iss claim';
COMMENT ON COLUMN oidc_tokens.provider_instance_id IS 'Provider instance identifier for quick lookup';
COMMENT ON COLUMN oidc_tokens.token_audience IS 'JWT token audience for validation - obtained from JWT token aud claim';

COMMENT ON COLUMN oidc_sessions.provider_instance_id IS 'Provider instance identifier for quick lookup';
COMMENT ON COLUMN oidc_sessions.provider_environment IS 'Provider environment for audit and debugging';

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Insert record for this migration
INSERT INTO schema_migrations (version, name, checksum, status)
VALUES (5, 'support_multiple_providers_same_type', 'support_multiple_providers_same_type_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
