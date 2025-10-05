-- AGoat Publisher - Sites Data (AI Generated)
-- Generated on: 2025-10-05
-- Source: Live database analysis
-- Description: Data inserts for sites table

-- =============================================================================
-- SITES DATA
-- =============================================================================

-- Insert sites data
INSERT INTO sites (
    id,
    customer_id,
    name,
    slug,
    domain,
    status,
    created_at,
    updated_at,
    deleted_at
) VALUES 
-- Site 1 - Top Vitamin Supply Main Site
(
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    '18c6498d-f738-4c9f-aefd-d66bec11d751',
    'Top Vitamin Supply',
    'top-vitamin-supply',
    'dev.np-topvitaminsupply.com',
    'active',
    '2024-01-15 10:35:00+00',
    '2024-01-15 10:35:00+00',
    NULL
),
-- Site 2 - Test Site
(
    'c3d4e5f6-g7h8-9012-cdef-345678901234',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Test Site',
    'test-site',
    'test.example.com',
    'active',
    '2024-10-01 08:05:00+00',
    '2024-10-01 08:05:00+00',
    NULL
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE sites IS 'Sites within customers for multitenant content management - Contains 2 active sites';
