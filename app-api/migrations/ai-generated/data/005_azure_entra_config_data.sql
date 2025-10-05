-- AGoat Publisher - Azure Entra Config Data (AI Generated)
-- Generated on: 2025-10-05
-- Source: Live database analysis
-- Description: Data inserts for azure_entra_config table

-- =============================================================================
-- AZURE ENTRA CONFIG DATA
-- =============================================================================

-- Insert azure_entra_config data
INSERT INTO azure_entra_config (
    id,
    tenant_id,
    client_id,
    client_secret_encrypted,
    authority_url,
    redirect_uri,
    scopes,
    is_active,
    created_at,
    updated_at
) VALUES 
-- Azure Entra Configuration
(
    'd4e5f6g7-h8i9-0123-defg-456789012345',
    'your-tenant-id-here',
    'your-client-id-here',
    'encrypted-client-secret-here',
    'https://login.microsoftonline.com/your-tenant-id-here/v2.0',
    'https://dev.np-topvitaminsupply.com/auth/callback',
    'openid profile email',
    true,
    '2024-01-15 10:45:00+00',
    '2024-01-15 10:45:00+00'
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE azure_entra_config IS 'Azure Entra ID configuration for authentication - Contains 1 active configuration';
