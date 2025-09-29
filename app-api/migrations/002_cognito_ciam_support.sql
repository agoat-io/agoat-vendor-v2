-- Migration: 002_cognito_ciam_support.sql
-- Description: Add AWS Cognito and Multi-CIAM support
-- Date: 2024-09-28
-- Author: AGoat Publisher Team
-- 
-- This migration adds support for AWS Cognito authentication and multi-CIAM system management
-- Based on the requirements for Cognito integration with JWKS validation

-- =============================================================================
-- CIAM SYSTEMS CONFIGURATION TABLE
-- =============================================================================
-- Configuration for different CIAM (Customer Identity and Access Management) systems
CREATE TABLE IF NOT EXISTS ciam_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_name VARCHAR(50) NOT NULL UNIQUE, -- 'cognito', 'azure_entra', 'auth0', etc.
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    jwks_url TEXT,
    issuer_url TEXT,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- USER CIAM MAPPINGS TABLE
-- =============================================================================
-- Mappings between app users and CIAM system identities
-- Supports multiple CIAM systems per user with one current active mapping
CREATE TABLE IF NOT EXISTS user_ciam_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ciam_identifier VARCHAR(255) NOT NULL,
    ciam_system VARCHAR(50) NOT NULL, -- 'cognito', 'azure_entra', 'auth0', etc.
    ciam_user_pool_id VARCHAR(100), -- For Cognito: us-east-1_FJUcN8W07
    ciam_tenant_id VARCHAR(100), -- For Azure: tenant-id
    is_current_ciam BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(app_user_id, ciam_identifier, ciam_system)
);

-- =============================================================================
-- ADD COGNITO FIELDS TO USERS TABLE
-- =============================================================================
-- Add Cognito-specific fields to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_sub VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_user_pool_id VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS given_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cognito_updated_at TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- CIAM systems indexes
CREATE INDEX IF NOT EXISTS idx_ciam_systems_active ON ciam_systems (is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ciam_systems_name ON ciam_systems (system_name);

-- User CIAM mappings indexes
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_app_user_id ON user_ciam_mappings (app_user_id);
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_ciam_identifier ON user_ciam_mappings (ciam_identifier);
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_current ON user_ciam_mappings (app_user_id, is_current_ciam) WHERE is_current_ciam = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_ciam_mappings_system ON user_ciam_mappings (ciam_system);

-- Cognito user fields indexes
CREATE INDEX IF NOT EXISTS idx_users_cognito_sub ON users (cognito_sub) WHERE cognito_sub IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_cognito_user_pool_id ON users (cognito_user_pool_id) WHERE cognito_user_pool_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users (phone_number) WHERE phone_number IS NOT NULL;

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- =============================================================================

-- Create triggers for updated_at
CREATE TRIGGER IF NOT EXISTS trigger_update_ciam_systems_updated_at
    BEFORE UPDATE ON ciam_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_update_user_ciam_mappings_updated_at
    BEFORE UPDATE ON user_ciam_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTION TO ENSURE SINGLE CURRENT CIAM PER USER
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
DROP TRIGGER IF EXISTS trigger_ensure_single_current_ciam ON user_ciam_mappings;
CREATE TRIGGER trigger_ensure_single_current_ciam
    BEFORE INSERT OR UPDATE ON user_ciam_mappings
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_current_ciam();

-- =============================================================================
-- INSERT DEFAULT CIAM SYSTEMS
-- =============================================================================

-- Insert Cognito system configuration
INSERT INTO ciam_systems (system_name, display_name, is_active, jwks_url, issuer_url, configuration) VALUES
('cognito', 'AWS Cognito', TRUE, 
 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07/.well-known/jwks.json',
 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FJUcN8W07',
 '{"user_pool_id": "us-east-1_FJUcN8W07", "client_id": "4lt0iqap612c9jug55f3a1s69k", "region": "us-east-1", "domain": "auth.dev.np-topvitaminsupply.com", "auth_url": "https://auth.dev.np-topvitaminsupply.com/login/continue", "token_url": "https://auth.dev.np-topvitaminsupply.com/oauth2/token"}')
ON CONFLICT (system_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    jwks_url = EXCLUDED.jwks_url,
    issuer_url = EXCLUDED.issuer_url,
    configuration = EXCLUDED.configuration,
    updated_at = NOW();

-- Insert Azure Entra ID system configuration (for backward compatibility)
INSERT INTO ciam_systems (system_name, display_name, is_active, jwks_url, issuer_url, configuration) VALUES
('azure_entra', 'Microsoft Azure Entra ID', TRUE,
 'https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys',
 'https://login.microsoftonline.com/{tenant_id}/v2.0',
 '{"tenant_id": "placeholder", "client_id": "placeholder", "authority_url": "https://login.microsoftonline.com/{tenant_id}", "scope": "openid profile email"}')
ON CONFLICT (system_name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    jwks_url = EXCLUDED.jwks_url,
    issuer_url = EXCLUDED.issuer_url,
    configuration = EXCLUDED.configuration,
    updated_at = NOW();

-- =============================================================================
-- MIGRATE EXISTING AZURE USERS TO CIAM MAPPINGS
-- =============================================================================

-- Create CIAM mappings for existing Azure users
INSERT INTO user_ciam_mappings (app_user_id, ciam_identifier, ciam_system, ciam_tenant_id, is_current_ciam)
SELECT 
    u.id,
    u.azure_entra_id,
    'azure_entra',
    u.azure_tenant_id,
    TRUE
FROM users u
WHERE u.azure_entra_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM user_ciam_mappings ucm 
    WHERE ucm.app_user_id = u.id 
    AND ucm.ciam_system = 'azure_entra'
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE ciam_systems IS 'Configuration for different CIAM (Customer Identity and Access Management) systems';
COMMENT ON TABLE user_ciam_mappings IS 'Mappings between app users and CIAM system identities, supporting multiple CIAM systems per user with one current active mapping';

COMMENT ON COLUMN ciam_systems.system_name IS 'Unique identifier for the CIAM system (cognito, azure_entra, auth0, etc.)';
COMMENT ON COLUMN ciam_systems.configuration IS 'JSON configuration specific to the CIAM system';
COMMENT ON COLUMN user_ciam_mappings.ciam_identifier IS 'The unique identifier for the user in the CIAM system';
COMMENT ON COLUMN user_ciam_mappings.is_current_ciam IS 'Indicates if this is the currently active CIAM system for the user';
COMMENT ON COLUMN user_ciam_mappings.ciam_user_pool_id IS 'CIAM-specific pool/tenant identifier (e.g., Cognito User Pool ID)';
COMMENT ON COLUMN user_ciam_mappings.ciam_tenant_id IS 'CIAM-specific tenant identifier (e.g., Azure Tenant ID)';

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Insert record for this migration
INSERT INTO schema_migrations (version, name, checksum, status)
VALUES (2, 'cognito_ciam_support', 'cognito_ciam_support_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
