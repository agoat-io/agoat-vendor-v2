-- Migration: 004_remove_cognito_backward_compatibility.sql
-- Description: Remove backward compatibility with Cognito-specific fields and ensure OIDC provider alignment only through mapping table
-- Date: 2024-09-28
-- Author: AGoat Publisher Team
-- 
-- This migration removes all backward compatibility with Cognito-specific fields
-- and ensures that OIDC provider alignment is only through the user_ciam_mappings table.
-- This aligns with global instructions for a clean, provider-agnostic architecture.

-- =============================================================================
-- REMOVE COGNITO-SPECIFIC FIELDS FROM USERS TABLE
-- =============================================================================
-- Remove all Cognito-specific fields from the users table
-- OIDC provider alignment should only be through user_ciam_mappings table

-- Drop Cognito-specific columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS cognito_sub;
ALTER TABLE users DROP COLUMN IF EXISTS cognito_user_pool_id;
ALTER TABLE users DROP COLUMN IF EXISTS cognito_created_at;
ALTER TABLE users DROP COLUMN IF EXISTS cognito_updated_at;

-- =============================================================================
-- REMOVE AZURE-SPECIFIC FIELDS FROM USERS TABLE
-- =============================================================================
-- Remove all Azure-specific fields from the users table
-- OIDC provider alignment should only be through user_ciam_mappings table

-- Drop Azure-specific columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS azure_entra_id;
ALTER TABLE users DROP COLUMN IF EXISTS azure_tenant_id;
ALTER TABLE users DROP COLUMN IF EXISTS azure_object_id;
ALTER TABLE users DROP COLUMN IF EXISTS azure_principal_name;
ALTER TABLE users DROP COLUMN IF EXISTS azure_display_name;
ALTER TABLE users DROP COLUMN IF EXISTS azure_given_name;
ALTER TABLE users DROP COLUMN IF EXISTS azure_family_name;
ALTER TABLE users DROP COLUMN IF EXISTS azure_preferred_username;
ALTER TABLE users DROP COLUMN IF EXISTS created_by_azure;
ALTER TABLE users DROP COLUMN IF EXISTS azure_created_at;
ALTER TABLE users DROP COLUMN IF EXISTS azure_updated_at;

-- =============================================================================
-- REMOVE PROVIDER-SPECIFIC FIELDS FROM USER_CIAM_MAPPINGS TABLE
-- =============================================================================
-- Remove provider-specific fields from user_ciam_mappings table
-- All provider-specific data should be stored in provider_metadata JSONB field

-- Drop provider-specific columns from user_ciam_mappings table
ALTER TABLE user_ciam_mappings DROP COLUMN IF EXISTS ciam_user_pool_id;
ALTER TABLE user_ciam_mappings DROP COLUMN IF EXISTS ciam_tenant_id;

-- =============================================================================
-- REMOVE LEGACY CONFIGURATION TABLE
-- =============================================================================
-- Remove the legacy azure_entra_config table
-- All configuration should be in ciam_systems table

DROP TABLE IF EXISTS azure_entra_config;

-- =============================================================================
-- UPDATE AUTH_METHOD CONSTRAINT
-- =============================================================================
-- Update auth_method constraint to only allow OIDC-compliant methods
-- Remove provider-specific auth methods

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_auth_method_check;
ALTER TABLE users ADD CONSTRAINT users_auth_method_check 
    CHECK (auth_method IN ('local', 'oidc'));

-- =============================================================================
-- REMOVE PROVIDER-SPECIFIC INDEXES
-- =============================================================================
-- Remove indexes for provider-specific fields that no longer exist

DROP INDEX IF EXISTS idx_users_cognito_sub;
DROP INDEX IF EXISTS idx_users_cognito_user_pool_id;
DROP INDEX IF EXISTS idx_users_azure_entra_id;
DROP INDEX IF EXISTS idx_users_azure_object_id;
DROP INDEX IF EXISTS idx_azure_entra_config_active;
DROP INDEX IF EXISTS idx_azure_entra_config_tenant_id;

-- =============================================================================
-- UPDATE CIAM_SYSTEMS TABLE TO REMOVE LEGACY CONFIGURATION
-- =============================================================================
-- Remove the legacy configuration JSONB field
-- All configuration should be in the structured OIDC fields

ALTER TABLE ciam_systems DROP COLUMN IF EXISTS configuration;

-- =============================================================================
-- UPDATE USER_CIAM_MAPPINGS TO ENSURE PROVIDER_METADATA IS USED
-- =============================================================================
-- Migrate any remaining provider-specific data to provider_metadata
-- This ensures all provider-specific data is in the JSONB field

-- Update any existing mappings to use provider_metadata for provider-specific data
UPDATE user_ciam_mappings SET 
    provider_metadata = COALESCE(provider_metadata, '{}'::jsonb) || 
    CASE 
        WHEN ciam_system = 'cognito' THEN 
            jsonb_build_object('user_pool_id', provider_identifier)
        WHEN ciam_system = 'azure_entra' THEN 
            jsonb_build_object('tenant_id', provider_identifier)
        ELSE '{}'::jsonb
    END
WHERE provider_metadata IS NULL OR provider_metadata = '{}'::jsonb;

-- =============================================================================
-- UPDATE USERS TABLE TO ENSURE PROVIDER_METADATA IS USED
-- =============================================================================
-- Migrate any remaining provider-specific data to provider_metadata
-- This ensures all provider-specific data is in the JSONB field

-- Update users to use provider_metadata for any remaining provider-specific data
UPDATE users SET 
    provider_metadata = COALESCE(provider_metadata, '{}'::jsonb) || 
    jsonb_build_object(
        'legacy_migration', true,
        'migration_date', NOW()
    )
WHERE provider_metadata IS NULL OR provider_metadata = '{}'::jsonb;

-- =============================================================================
-- ADD CONSTRAINTS TO ENSURE DATA INTEGRITY
-- =============================================================================
-- Add constraints to ensure proper OIDC compliance

-- Ensure ciam_identifier is not empty
ALTER TABLE user_ciam_mappings ADD CONSTRAINT user_ciam_mappings_ciam_identifier_not_empty 
    CHECK (ciam_identifier IS NOT NULL AND ciam_identifier != '');

-- Ensure provider_identifier is not empty when provided
ALTER TABLE user_ciam_mappings ADD CONSTRAINT user_ciam_mappings_provider_identifier_not_empty 
    CHECK (provider_identifier IS NULL OR provider_identifier != '');

-- Ensure ciam_system is not empty
ALTER TABLE user_ciam_mappings ADD CONSTRAINT user_ciam_mappings_ciam_system_not_empty 
    CHECK (ciam_system IS NOT NULL AND ciam_system != '');

-- =============================================================================
-- UPDATE COMMENTS TO REFLECT NEW STRUCTURE
-- =============================================================================
-- Update table and column comments to reflect the new OIDC-only structure

COMMENT ON TABLE users IS 'User accounts with OIDC-compliant authentication support only';
COMMENT ON TABLE user_ciam_mappings IS 'OIDC provider-agnostic user identity mappings - all provider-specific data stored in provider_metadata JSONB field';
COMMENT ON TABLE ciam_systems IS 'OIDC-compliant CIAM system configurations - no legacy configuration fields';

-- Update column comments
COMMENT ON COLUMN users.auth_method IS 'Authentication method - only local or oidc allowed';
COMMENT ON COLUMN users.provider_metadata IS 'Provider-specific user data stored as JSONB - no provider-specific columns';
COMMENT ON COLUMN user_ciam_mappings.provider_metadata IS 'All provider-specific data stored here - no provider-specific columns';
COMMENT ON COLUMN user_ciam_mappings.provider_identifier IS 'Generic provider identifier - specific data in provider_metadata';

-- =============================================================================
-- CREATE FUNCTION TO VALIDATE OIDC COMPLIANCE
-- =============================================================================
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
DROP TRIGGER IF EXISTS trigger_validate_oidc_compliance ON users;
CREATE TRIGGER trigger_validate_oidc_compliance
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_oidc_compliance();

-- =============================================================================
-- CREATE FUNCTION TO GET USER'S CURRENT OIDC PROVIDER
-- =============================================================================
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

-- =============================================================================
-- CREATE FUNCTION TO GET USER'S OIDC CLAIMS
-- =============================================================================
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
-- UPDATE EXISTING DATA TO ENSURE OIDC COMPLIANCE
-- =============================================================================
-- Update existing users to ensure they have proper OIDC mappings

-- Update users with oidc auth_method to ensure they have current CIAM mappings
UPDATE users SET 
    auth_method = 'oidc'
WHERE auth_method IN ('cognito', 'azure_entra');

-- Ensure all users with oidc auth_method have current CIAM mappings
INSERT INTO user_ciam_mappings (app_user_id, ciam_identifier, ciam_system, provider_identifier, is_current_ciam, last_authenticated_at)
SELECT 
    u.id,
    COALESCE(u.oidc_sub, u.email), -- Use oidc_sub if available, otherwise email
    'cognito', -- Default to cognito for existing users
    'legacy_migration', -- Provider identifier for migrated users
    TRUE,
    COALESCE(u.last_login_at, u.created_at)
FROM users u
WHERE u.auth_method = 'oidc'
AND NOT EXISTS (
    SELECT 1 FROM user_ciam_mappings ucm 
    WHERE ucm.app_user_id = u.id 
    AND ucm.is_current_ciam = TRUE
);

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Insert record for this migration
INSERT INTO schema_migrations (version, name, checksum, status)
VALUES (4, 'remove_cognito_backward_compatibility', 'remove_cognito_backward_compatibility_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
