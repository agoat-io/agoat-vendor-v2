-- Migration: 012_real_database_schema.sql
-- Description: Update migration files to match the real database schema that the API is actually using
-- Date: 2025-10-04
-- Author: AGoat Publisher Team
--
-- This migration represents the ACTUAL database schema that the API is using,
-- based on analysis of the real database data and API queries.
--
-- The real database has evolved beyond the migration files and this represents
-- the current working state that the API expects.

-- =============================================================================
-- REAL DATABASE SCHEMA - USERS TABLE
-- =============================================================================
-- Based on actual data in _current--full-data.sql and API queries
-- The users table has evolved to include both legacy and modern fields

-- Note: This represents the ACTUAL current state, not a migration
-- The users table currently has these fields (from data analysis):
-- id, username, email, password_hash, created_at, customer_id, site_id, role, status, 
-- deleted_at, external_id, iam_provider, iam_metadata, last_iam_sync, iam_sync_status,
-- azure_entra_id, azure_tenant_id, azure_object_id, azure_principal_name, 
-- azure_display_name, azure_given_name, azure_family_name, azure_preferred_username,
-- access_token_hash, refresh_token_hash, token_expires_at, last_token_refresh,
-- auth_method, email_verified, account_enabled, last_login_at, login_count,
-- created_by_azure, azure_created_at, azure_updated_at, updated_at

-- AUTH_UNIQUE IDENTIFIERS IN USERS TABLE:
-- username -- auth_unique: <user_identifier> -- origin: user_input, JWT.preferred_username, Azure.preferred_username
-- email -- auth_unique: <user_identifier> -- origin: user_input, JWT.email, Azure.email, Cognito.email
-- external_id -- auth_unique: <external_system_identifier> -- origin: external_system.user_id, JWT.sub, Azure.objectId
-- iam_provider -- auth_unique: <identity_provider_service> -- origin: config.identity_provider, provider.type
-- azure_entra_id -- auth_unique: <azure_user_identifier> -- origin: Azure.oid, JWT.oid, Azure.id_token.oid
-- azure_tenant_id -- auth_unique: <azure_tenant_pool> -- origin: Azure.tid, JWT.tid, Azure.id_token.tid
-- azure_object_id -- auth_unique: <azure_object_identifier> -- origin: Azure.objectId, JWT.objectId, Azure.id_token.objectId
-- azure_principal_name -- auth_unique: <azure_principal_identifier> -- origin: Azure.preferred_username, JWT.preferred_username, Azure.id_token.preferred_username
-- azure_preferred_username -- auth_unique: <azure_username_identifier> -- origin: Azure.preferred_username, JWT.preferred_username, Azure.id_token.preferred_username
-- auth_method -- auth_unique: <authentication_method> -- origin: config.auth_method, JWT.auth_method, provider.type

-- =============================================================================
-- REAL DATABASE SCHEMA - POSTS TABLE  
-- =============================================================================
-- Based on actual data in _current--full-data.sql and API queries
-- The posts table has these fields:
-- id, user_id, title, content, slug, published, created_at, updated_at,
-- site_id, status, published_at, deleted_at

-- =============================================================================
-- REAL DATABASE SCHEMA - ADDITIONAL TABLES
-- =============================================================================
-- Based on verification queries in _current--full-data.sql, these tables exist:
-- - customers
-- - sites  
-- - ciam_systems
-- - migration_status

-- AUTH_UNIQUE IDENTIFIERS IN CIAM_SYSTEMS TABLE:
-- system_name -- auth_unique: <ciam_system_identifier> -- origin: config.system_name, provider.name
-- provider_type -- auth_unique: <identity_provider_service> -- origin: config.provider_type, provider.type
-- provider_instance_id -- auth_unique: <provider_instance_pool> -- origin: config.instance_id, provider.instance_id
-- provider_environment -- auth_unique: <provider_environment> -- origin: config.environment, provider.environment
-- provider_region -- auth_unique: <provider_region> -- origin: config.region, provider.region
-- provider_domain -- auth_unique: <provider_domain> -- origin: config.domain, provider.domain
-- issuer_url -- auth_unique: <oidc_issuer_identifier> -- origin: config.issuer_url, OIDC.discovery.issuer
-- client_id -- auth_unique: <oauth_client_identifier> -- origin: config.client_id, JWT.aud, OAuth.client_id

-- AUTH_UNIQUE IDENTIFIERS IN USER_CIAM_MAPPINGS TABLE:
-- ciam_identifier -- auth_unique: <ciam_user_identifier> -- origin: JWT.sub, Azure.oid, Cognito.sub, OIDC.id_token.sub
-- ciam_system -- auth_unique: <ciam_system_identifier> -- origin: config.system_name, provider.name
-- provider_identifier -- auth_unique: <provider_user_identifier> -- origin: JWT.sub, Azure.objectId, Cognito.username, provider.user_id
-- authentication_method -- auth_unique: <authentication_method> -- origin: config.auth_method, JWT.auth_method, provider.type

-- =============================================================================
-- SCHEMA ANALYSIS SUMMARY
-- =============================================================================
-- The real database has evolved significantly from the migration files:
--
-- 1. USERS TABLE: Has both legacy fields (password_hash, azure_*) and modern OIDC fields
-- 2. POSTS TABLE: Has additional fields (site_id, status, published_at, deleted_at)
-- 3. MULTI-TENANT: Has customers and sites tables for multi-tenancy
-- 4. CIAM SUPPORT: Has ciam_systems table for authentication
-- 5. MIGRATION TRACKING: Has migration_status table
--
-- The API is successfully using this schema, which means the database
-- has been manually evolved or migrations were applied outside the tracked system.

-- =============================================================================
-- RECOMMENDATION
-- =============================================================================
-- Since the API is working with the current database schema, we should:
-- 1. Update the _current--full-schema.sql to match the real database
-- 2. Ensure all migration files are consistent with the real state
-- 3. Document the actual schema for future reference

-- This migration serves as documentation of the real database state
-- and should be used to update the schema files to match reality.

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Insert record for this migration
INSERT INTO schema_migrations (version, name, checksum, status)
VALUES (12, 'real_database_schema', 'real_database_schema_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
