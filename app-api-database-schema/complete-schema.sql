-- =============================================================================
-- AGoat Publisher - Complete Database Schema
-- =============================================================================
-- This script creates the complete database schema from scratch
-- Includes: Initial schema + Multitenancy support + IAM integration
-- Optimized for CockroachDB performance and scalability
-- Date: 2025-01-15
-- Author: AGoat Publisher Team

-- =============================================================================
-- INITIAL SCHEMA (Base Tables)
-- =============================================================================

-- Users table (base)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- Posts table (base)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- =============================================================================
-- MULTITENANCY SCHEMA
-- =============================================================================

-- CUSTOMERS TABLE
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

-- SITES TABLE
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

-- DOMAINS TABLE
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

-- TENANT USAGE TRACKING
CREATE TABLE tenant_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(customer_id, site_id, metric_name, period_start)
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- SITE SETTINGS
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(site_id, setting_key)
);

-- =============================================================================
-- IAM INTEGRATION SCHEMA
-- =============================================================================

-- IAM PROVIDERS
CREATE TABLE iam_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    provider_name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('auth0', 'okta', 'azure', 'google', 'custom')),
    client_id VARCHAR(255) NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    domain VARCHAR(255),
    configuration JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(customer_id, provider_name)
);

-- IAM USER MAPPINGS
CREATE TABLE iam_user_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES iam_providers(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    external_email VARCHAR(255),
    external_username VARCHAR(255),
    sync_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'disabled')),
    last_sync_at TIMESTAMP,
    sync_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(provider_id, external_id),
    UNIQUE(user_id, provider_id)
);

-- IAM GROUP MAPPINGS
CREATE TABLE iam_group_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES iam_providers(id) ON DELETE CASCADE,
    external_group_id VARCHAR(255) NOT NULL,
    external_group_name VARCHAR(255) NOT NULL,
    internal_role VARCHAR(50) NOT NULL CHECK (internal_role IN ('admin', 'editor', 'author', 'user')),
    auto_assign BOOLEAN NOT NULL DEFAULT false,
    sync_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'disabled')),
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(provider_id, external_group_id)
);

-- =============================================================================
-- MODIFY EXISTING TABLES FOR MULTITENANCY
-- =============================================================================

-- Add tenant context to users table
ALTER TABLE users ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'author', 'user'));
ALTER TABLE users ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Add IAM integration fields to users
ALTER TABLE users ADD COLUMN external_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN iam_provider VARCHAR(50) DEFAULT 'default';
ALTER TABLE users ADD COLUMN iam_metadata JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN last_iam_sync TIMESTAMP;
ALTER TABLE users ADD COLUMN iam_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (iam_sync_status IN ('pending', 'synced', 'failed', 'disabled'));

-- Add tenant context to posts table
ALTER TABLE posts ADD COLUMN site_id UUID REFERENCES sites(id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
ALTER TABLE posts ADD COLUMN published_at TIMESTAMP;
ALTER TABLE posts ADD COLUMN deleted_at TIMESTAMP;

-- =============================================================================
-- OPTIMIZED INDEXES FOR COCKROACHDB
-- =============================================================================

-- Customer indexes
CREATE INDEX idx_customers_status_subscription ON customers (status, subscription_status) WHERE deleted_at IS NULL;

-- Site indexes
CREATE INDEX idx_sites_customer_status ON sites (customer_id, status) WHERE deleted_at IS NULL;

-- Domain indexes
CREATE INDEX idx_domains_site_status ON domains (site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_domains_ssl_expires ON domains (ssl_expires_at) WHERE ssl_status = 'active';

-- User indexes (optimized for tenant queries)
CREATE INDEX idx_users_customer_role_status ON users (customer_id, role, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_site_status ON users (site_id, status) WHERE deleted_at IS NULL AND site_id IS NOT NULL;
CREATE INDEX idx_users_email_customer ON users (email, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_external_id ON users (external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_users_iam_provider ON users (iam_provider) WHERE iam_provider != 'default';
CREATE INDEX idx_users_iam_sync_status ON users (iam_sync_status) WHERE iam_sync_status != 'pending';

-- Post indexes (optimized for tenant queries)
CREATE INDEX idx_posts_site_status ON posts (site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_site_published_at ON posts (site_id, published_at DESC) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_posts_slug_site ON posts (slug, site_id) WHERE deleted_at IS NULL;

-- Tenant usage indexes
CREATE INDEX idx_tenant_usage_customer_metric ON tenant_usage (customer_id, metric_name, period_start DESC);
CREATE INDEX idx_tenant_usage_site_metric ON tenant_usage (site_id, metric_name, period_start DESC);
CREATE INDEX idx_tenant_usage_period_customer ON tenant_usage (period_start, customer_id) WHERE period_start >= current_timestamp() - INTERVAL '30 days';

-- Audit log indexes
CREATE INDEX idx_audit_logs_customer_created ON audit_logs (customer_id, created_at DESC);
CREATE INDEX idx_audit_logs_site_created ON audit_logs (site_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_created ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource_action ON audit_logs (resource_type, action, created_at DESC);

-- IAM indexes
CREATE INDEX idx_iam_user_mappings_customer_id ON iam_user_mappings (customer_id);
CREATE INDEX idx_iam_user_mappings_user_id ON iam_user_mappings (user_id);
CREATE INDEX idx_iam_user_mappings_provider_id ON iam_user_mappings (provider_id);
CREATE INDEX idx_iam_user_mappings_external_id ON iam_user_mappings (external_id);
CREATE INDEX idx_iam_user_mappings_sync_status ON iam_user_mappings (sync_status);

CREATE INDEX idx_iam_group_mappings_customer_id ON iam_group_mappings (customer_id);
CREATE INDEX idx_iam_group_mappings_provider_id ON iam_group_mappings (provider_id);
CREATE INDEX idx_iam_group_mappings_external_id ON iam_group_mappings (external_group_id);
CREATE INDEX idx_iam_group_mappings_role ON iam_group_mappings (internal_role);
CREATE INDEX idx_iam_group_mappings_auto_assign ON iam_group_mappings (auto_assign) WHERE auto_assign = true;

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = current_timestamp();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iam_providers_updated_at BEFORE UPDATE ON iam_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iam_user_mappings_updated_at BEFORE UPDATE ON iam_user_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iam_group_mappings_updated_at BEFORE UPDATE ON iam_group_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default customer and site for system
DO $$
DECLARE
    default_customer_id UUID;
    default_site_id UUID;
BEGIN
    -- Insert default customer
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
    RETURNING id INTO default_customer_id;

    -- Insert default site
    INSERT INTO sites (customer_id, name, slug, status, template)
    VALUES (default_customer_id, 'Default Site', 'default', 'active', 'default')
    RETURNING id INTO default_site_id;

    -- Update existing users to belong to default customer and site
    UPDATE users SET 
        customer_id = default_customer_id,
        site_id = default_site_id,
        role = 'admin'
    WHERE customer_id IS NULL;

    -- Update existing posts to belong to default site
    UPDATE posts SET 
        site_id = default_site_id
    WHERE site_id IS NULL;
END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE users IS 'User accounts with tenant context and IAM integration';
COMMENT ON TABLE posts IS 'Content posts with tenant context';
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
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Create schema_migrations table for tracking applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);

-- Insert record for this complete schema
INSERT INTO schema_migrations (version, name, checksum, status)
VALUES (1, 'complete_schema_initial', 'complete_schema_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================

-- This completes the full database schema setup
-- The database is now ready for multitenant operations with IAM integration
