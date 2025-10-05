-- AGoat Publisher - Users Data (AI Generated)
-- Generated on: 2025-10-05
-- Source: Live database analysis
-- Description: Data inserts for users table

-- =============================================================================
-- USERS DATA
-- =============================================================================

-- Insert users data
INSERT INTO users (
    id,
    username,
    email,
    password_hash,
    created_at,
    customer_id,
    site_id,
    role,
    status,
    deleted_at,
    external_id,
    iam_provider,
    iam_metadata,
    last_iam_sync,
    iam_sync_status,
    azure_entra_id,
    azure_tenant_id,
    azure_object_id,
    azure_principal_name,
    azure_display_name,
    azure_given_name,
    azure_family_name,
    azure_preferred_username,
    access_token_hash,
    refresh_token_hash,
    token_expires_at,
    last_token_refresh,
    auth_method,
    email_verified,
    account_enabled,
    last_login_at,
    login_count,
    created_by_azure,
    azure_created_at,
    azure_updated_at,
    updated_at
) VALUES 
-- User 1 - Admin User
(
    1096773348868587521,
    'admin',
    'andrewqr@gmail.com',
    '$2a$10$example_hash_here',
    '2024-01-15 10:40:00+00',
    '18c6498d-f738-4c9f-aefd-d66bec11d751',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'admin',
    'active',
    NULL,
    'andrewqr@gmail.com',
    'cognito',
    '{"provider": "cognito", "region": "us-east-1"}',
    '2024-10-05 12:00:00+00',
    'success',
    NULL,
    NULL,
    NULL,
    NULL,
    'Andrew Smith',
    'Andrew',
    'Smith',
    'andrewqr@gmail.com',
    NULL,
    NULL,
    NULL,
    NULL,
    'cognito',
    true,
    true,
    '2024-10-05 12:00:00+00',
    15,
    false,
    NULL,
    NULL,
    '2024-10-05 12:00:00+00'
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE users IS 'User accounts with support for multiple authentication methods and multi-tenancy - Contains 1 admin user';
