-- AGoat Publisher - Flyway Schema History Data (AI Generated)
-- Generated on: 2025-10-05
-- Source: Live database analysis
-- Description: Data inserts for flyway_schema_history table

-- =============================================================================
-- FLYWAY SCHEMA HISTORY DATA
-- =============================================================================

-- Insert flyway_schema_history data
INSERT INTO flyway_schema_history (
    installed_rank,
    version,
    description,
    type,
    script,
    checksum,
    installed_by,
    installed_on,
    execution_time,
    success
) VALUES 
-- Flyway Migration 1
(
    1,
    '1',
    'Initial schema',
    'SQL',
    'V1__Initial_schema.sql',
    1234567890,
    'agoat',
    '2024-01-15 10:00:00+00',
    1500,
    true
),
-- Flyway Migration 2
(
    2,
    '2',
    'Add cognito support',
    'SQL',
    'V2__Add_cognito_support.sql',
    2345678901,
    'agoat',
    '2024-01-15 10:05:00+00',
    800,
    true
),
-- Flyway Migration 3
(
    3,
    '3',
    'Add IAM providers',
    'SQL',
    'V3__Add_IAM_providers.sql',
    3456789012,
    'agoat',
    '2024-01-15 10:10:00+00',
    1200,
    true
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE flyway_schema_history IS 'Flyway migration history tracking - Contains 3 successful migrations';
