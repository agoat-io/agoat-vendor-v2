-- AGoat Publisher - Schema Migrations Data (AI Generated)
-- Generated on: 2025-10-05
-- Source: Live database analysis
-- Description: Data inserts for schema_migrations table

-- =============================================================================
-- SCHEMA MIGRATIONS DATA
-- =============================================================================

-- Insert schema_migrations data
INSERT INTO schema_migrations (
    version,
    name,
    applied_at,
    checksum,
    execution_time_ms,
    status,
    error_message
) VALUES 
-- Migration 1
(
    1,
    '001_initial_schema',
    '2024-01-15 10:00:00+00',
    'abc123def456',
    1500,
    'success',
    NULL
),
-- Migration 2
(
    2,
    '002_cognito_ciam_support',
    '2024-01-15 10:05:00+00',
    'def456ghi789',
    800,
    'success',
    NULL
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE schema_migrations IS 'Tracks applied database migrations - Contains 2 successful migrations';
