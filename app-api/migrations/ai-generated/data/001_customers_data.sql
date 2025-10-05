-- AGoat Publisher - Customers Data (AI Generated)
-- Generated on: 2025-10-05
-- Source: Live database analysis
-- Description: Data inserts for customers table

-- =============================================================================
-- CUSTOMERS DATA
-- =============================================================================

-- Insert customers data
INSERT INTO customers (
    id,
    name,
    email,
    status,
    subscription_plan,
    subscription_status,
    trial_ends_at,
    subscription_ends_at,
    max_sites,
    max_storage_gb,
    max_bandwidth_gb,
    created_at,
    updated_at,
    deleted_at
) VALUES 
-- Customer 1
(
    '18c6498d-f738-4c9f-aefd-d66bec11d751',
    'Top Vitamin Supply',
    'admin@topvitaminsupply.com',
    'active',
    'professional',
    'active',
    NULL,
    NULL,
    10,
    100,
    1000,
    '2024-01-15 10:30:00+00',
    '2024-01-15 10:30:00+00',
    NULL
),
-- Customer 2
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Test Customer',
    'test@example.com',
    'active',
    'basic',
    'trial',
    '2024-12-31 23:59:59+00',
    NULL,
    1,
    10,
    100,
    '2024-10-01 08:00:00+00',
    '2024-10-01 08:00:00+00',
    NULL
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE customers IS 'Customer accounts for multitenant architecture - Contains 2 active customers';
