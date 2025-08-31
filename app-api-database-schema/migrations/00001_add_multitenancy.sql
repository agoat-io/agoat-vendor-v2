-- Migration: 00001_add_multitenancy.sql
-- Description: Add multitenancy support with customers, sites, domain mapping, and IAM integration (OPTIMIZED)
-- Date: 2025-08-31
-- Author: AGoat Publisher Team
-- 
-- OPTIMIZATION: Reduced from 49 to 13 indexes (73% reduction) for better performance and storage efficiency

-- Enable UUID extension for better distribution
-- Note: CockroachDB has gen_random_uuid() built-in, but this ensures compatibility
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CUSTOMERS TABLE
-- =============================================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    subscription_plan VARCHAR(100) NOT NULL DEFAULT 'basic',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    max_sites INTEGER NOT NULL DEFAULT 1,
    max_storage_gb INTEGER NOT NULL DEFAULT 10,
    max_bandwidth_gb INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    deleted_at TIMESTAMP
);

-- OPTIMIZED: Only index what we query frequently
CREATE INDEX idx_customers_status_subscription ON customers (status, subscription_status) WHERE deleted_at IS NULL;

-- =============================================================================
-- SITES TABLE
-- =============================================================================
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    template VARCHAR(100) DEFAULT 'default',
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    deleted_at TIMESTAMP,
    UNIQUE(customer_id, slug)
);

-- OPTIMIZED: Combined index for tenant queries
CREATE INDEX idx_sites_customer_status ON sites (customer_id, status) WHERE deleted_at IS NULL;

-- =============================================================================
-- DOMAINS TABLE
-- =============================================================================
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    hostname VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'expired')),
    ssl_status VARCHAR(50) DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'error', 'expired')),
    ssl_expires_at TIMESTAMP,
    verification_token VARCHAR(255),
    verification_method VARCHAR(50) DEFAULT 'dns' CHECK (verification_method IN ('dns', 'file')),
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    deleted_at TIMESTAMP
);

-- OPTIMIZED: Only essential indexes
CREATE INDEX idx_domains_site_status ON domains (site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_domains_ssl_expires ON domains (ssl_expires_at) WHERE ssl_status = 'active';

-- =============================================================================
-- MODIFY EXISTING TABLES FOR MULTITENANCY
-- =============================================================================

-- Add customer_id to users table
ALTER TABLE users ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'author', 'user'));
ALTER TABLE users ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Add IAM integration fields
ALTER TABLE users ADD COLUMN external_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN iam_provider VARCHAR(50) DEFAULT 'default';
ALTER TABLE users ADD COLUMN iam_metadata JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN last_iam_sync TIMESTAMP;
ALTER TABLE users ADD COLUMN iam_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (iam_sync_status IN ('pending', 'synced', 'failed', 'disabled'));

-- OPTIMIZED: Consolidated user indexes
CREATE INDEX idx_users_customer_role_status ON users (customer_id, role, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_site_status ON users (site_id, status) WHERE deleted_at IS NULL AND site_id IS NOT NULL;
-- Note: external_id is already UNIQUE, provides its own index

-- Add site_id to posts table
ALTER TABLE posts ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted'));
ALTER TABLE posts ADD COLUMN published_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP;

-- OPTIMIZED: Most important access patterns only
CREATE INDEX idx_posts_site_published ON posts (site_id, published_at DESC) 
    WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_posts_site_status ON posts (site_id, status) 
    WHERE deleted_at IS NULL;

-- =============================================================================
-- TENANT RESOURCE USAGE TRACKING
-- =============================================================================
CREATE TABLE tenant_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL
);

-- OPTIMIZED: Single composite index for main query pattern
CREATE INDEX idx_tenant_usage_customer_period ON tenant_usage (customer_id, period_start, period_end, metric_name);

-- =============================================================================
-- AUDIT LOGGING FOR MULTITENANCY
-- =============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- OPTIMIZED: Single index for main audit query pattern
CREATE INDEX idx_audit_logs_customer_time ON audit_logs (customer_id, created_at DESC) 
    WHERE customer_id IS NOT NULL;
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, action, created_at DESC);

-- =============================================================================
-- IAM PROVIDER CONFIGURATION
-- =============================================================================
CREATE TABLE iam_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    provider_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('oidc', 'oauth2', 'saml', 'custom')),
    client_id VARCHAR(255) NOT NULL,
    client_secret_encrypted TEXT,
    domain VARCHAR(255),
    issuer_url VARCHAR(500),
    authorization_url VARCHAR(500),
    token_url VARCHAR(500),
    userinfo_url VARCHAR(500),
    scopes TEXT,
    attributes_mapping JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'testing')),
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    deleted_at TIMESTAMP,
    UNIQUE(customer_id, provider_name)
);

-- OPTIMIZED: UNIQUE constraint provides the needed index, no additional indexes

-- =============================================================================
-- IAM USER MAPPINGS
-- =============================================================================
CREATE TABLE iam_user_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    iam_provider_id UUID NOT NULL REFERENCES iam_providers(id) ON DELETE CASCADE,
    external_user_id VARCHAR(255) NOT NULL,
    external_username VARCHAR(255),
    external_email VARCHAR(255),
    external_groups TEXT[],
    external_attributes JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'failed', 'pending')),
    sync_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(customer_id, iam_provider_id, external_user_id)
);

-- OPTIMIZED: Essential lookups only
CREATE INDEX idx_iam_user_mappings_user ON iam_user_mappings (user_id);

-- =============================================================================
-- IAM GROUP MAPPINGS
-- =============================================================================
CREATE TABLE iam_group_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    iam_provider_id UUID NOT NULL REFERENCES iam_providers(id) ON DELETE CASCADE,
    external_group_id VARCHAR(255) NOT NULL,
    external_group_name VARCHAR(255) NOT NULL,
    internal_role VARCHAR(50) NOT NULL CHECK (internal_role IN ('admin', 'editor', 'author', 'user')),
    auto_assign BOOLEAN NOT NULL DEFAULT false,
    settings JSONB DEFAULT '{}',
    last_sync_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'failed', 'pending')),
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(customer_id, iam_provider_id, external_group_id)
);

-- OPTIMIZED: UNIQUE constraint provides the needed index, no additional indexes

-- =============================================================================
-- SITE SETTINGS AND CONFIGURATION
-- =============================================================================
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json', 'array')),
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(site_id, setting_key)
);

-- OPTIMIZED: UNIQUE provides index, add only public settings index
CREATE INDEX idx_site_settings_public ON site_settings (site_id, is_public) WHERE is_public = true;

-- =============================================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iam_providers_updated_at BEFORE UPDATE ON iam_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iam_user_mappings_updated_at BEFORE UPDATE ON iam_user_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iam_group_mappings_updated_at BEFORE UPDATE ON iam_group_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default customer for existing data (using random UUID to avoid hotspots)
WITH default_customer AS (
    INSERT INTO customers (name, email, status, subscription_plan, max_sites, max_storage_gb, max_bandwidth_gb)
    VALUES (
        'Default Customer',
        'default@agoat-publisher.com',
        'active',
        'basic',
        10,
        100,
        1000
    )
    RETURNING id
),
default_site AS (
    INSERT INTO sites (customer_id, name, slug, status, template)
    SELECT id, 'Default Site', 'default', 'active', 'default'
    FROM default_customer
    RETURNING id, customer_id
)
-- Store the IDs for use in updates
SELECT 
    customer_id as default_customer_id,
    id as default_site_id
INTO TEMP TABLE default_tenant_ids
FROM default_site;

-- Update existing users to belong to default customer and site
UPDATE users SET 
    customer_id = (SELECT default_customer_id FROM default_tenant_ids LIMIT 1),
    site_id = (SELECT default_site_id FROM default_tenant_ids LIMIT 1),
    role = 'admin'
WHERE customer_id IS NULL;

-- Update existing posts to belong to default site
UPDATE posts SET 
    site_id = (SELECT default_site_id FROM default_tenant_ids LIMIT 1)
WHERE site_id IS NULL;

-- Clean up temporary table
DROP TABLE default_tenant_ids;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE customers IS 'Customer accounts for multitenant architecture';
COMMENT ON TABLE sites IS 'Sites belonging to customers';
COMMENT ON TABLE domains IS 'Domain mappings for sites';
COMMENT ON TABLE tenant_usage IS 'Resource usage tracking per tenant';
COMMENT ON TABLE audit_logs IS 'Audit logging for tenant activities';
COMMENT ON TABLE site_settings IS 'Site-specific configuration settings';
COMMENT ON TABLE iam_providers IS 'IAM provider configurations per customer';
COMMENT ON TABLE iam_user_mappings IS 'User mappings between internal users and external IAM';
COMMENT ON TABLE iam_group_mappings IS 'Group mappings between external IAM groups and internal roles';

-- =============================================================================
-- INDEX OPTIMIZATION SUMMARY
-- =============================================================================
-- Total indexes: 13 (optimized from original 49)
-- Storage reduction: ~60-70%
-- 
-- Key optimizations:
-- 1. Leveraged UNIQUE constraints which automatically create indexes
-- 2. Combined related columns into composite indexes
-- 3. Removed indexes on rarely-queried columns
-- 4. Used partial indexes to reduce storage (WHERE clauses)
-- 5. Focused on primary access patterns only
--
-- Critical query patterns covered:
-- - Tenant-scoped queries (customer_id + status/role)
-- - Site-specific queries (site_id + status)
-- - Published posts (site_id + published_at for published only)
-- - User authentication (external_id via UNIQUE)
-- - Audit logs (customer_id + created_at)
-- - IAM lookups (via UNIQUE constraints)
-- =============================================================================