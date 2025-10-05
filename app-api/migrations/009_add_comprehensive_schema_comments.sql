-- Migration: 009_add_comprehensive_schema_comments.sql
-- Description: Add comprehensive comments to all SQL schema definitions including user pool and app client identifiers
-- Date: 2025-10-01
-- Author: AGoat Publisher Team

-- =============================================================================
-- SCHEMA COMMENTS MIGRATION
-- =============================================================================
-- This migration adds comprehensive comments to all tables and columns
-- including identification of user pool unique identifiers and app client unique identifiers

-- Note: This migration documents the existing schema with comprehensive comments
-- The actual schema changes were made to _current--full-schema.sql
-- This migration serves as a record of the comprehensive commenting effort

-- =============================================================================
-- MIGRATION RECORD
-- =============================================================================

INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(10, 'add_comprehensive_schema_comments', 'add_comprehensive_schema_comments_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
