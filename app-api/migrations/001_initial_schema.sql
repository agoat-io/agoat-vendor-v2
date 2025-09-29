-- Migration: 001_initial_schema.sql
-- Description: Create initial database schema for AGoat Publisher
-- Date: 2024-09-28
-- Author: AGoat Publisher Team
-- 
-- This migration creates the base tables for the AGoat Publisher system
-- Based on reverse engineering of the current application code

-- =============================================================================
-- CUSTOMERS TABLE
-- =============================================================================
-- Customer accounts for multitenant architecture
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
    subscription_plan VARCHAR(100) NOT NULL DEFAULT 'basic',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    max_sites INTEGER NOT NULL DEFAULT 1,
    max_storage_gb INTEGER NOT NULL DEFAULT 10,
    max_bandwidth_gb INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- SITES TABLE
-- =============================================================================
-- Sites belonging to customers
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    template VARCHAR(100) DEFAULT 'default',
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(customer_id, slug)
);

-- =============================================================================
-- USERS TABLE
-- =============================================================================
-- User accounts with Azure Entra ID integration
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    
    -- Azure Entra ID fields
    azure_entra_id VARCHAR(255),
    azure_tenant_id VARCHAR(255),
    azure_object_id VARCHAR(255),
    azure_principal_name VARCHAR(255),
    azure_display_name VARCHAR(255),
    azure_given_name VARCHAR(255),
    azure_family_name VARCHAR(255),
    azure_preferred_username VARCHAR(255),
    
    -- Authentication and status
    auth_method VARCHAR(50) DEFAULT 'default',
    email_verified BOOLEAN DEFAULT false,
    account_enabled BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Azure metadata
    created_by_azure BOOLEAN DEFAULT false,
    azure_created_at TIMESTAMP WITH TIME ZONE,
    azure_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Standard timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- POSTS TABLE
-- =============================================================================
-- Content posts with tenant context
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'deleted')),
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- AZURE ENTRA CONFIG TABLE
-- =============================================================================
-- Azure Entra ID configuration
CREATE TABLE IF NOT EXISTS azure_entra_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    tenant_name VARCHAR(255) NOT NULL,
    client_id VARCHAR(255) NOT NULL,
    authority_url VARCHAR(500) NOT NULL,
    redirect_uri VARCHAR(500) NOT NULL,
    scope VARCHAR(500) NOT NULL,
    response_type VARCHAR(50) NOT NULL DEFAULT 'code',
    response_mode VARCHAR(50) NOT NULL DEFAULT 'query',
    code_challenge_method VARCHAR(50) NOT NULL DEFAULT 'S256',
    token_endpoint VARCHAR(500) NOT NULL,
    userinfo_endpoint VARCHAR(500) NOT NULL,
    jwks_uri VARCHAR(500) NOT NULL,
    issuer VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email) WHERE deleted_at IS NULL;

-- Site indexes
CREATE INDEX IF NOT EXISTS idx_sites_customer_id ON sites (customer_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites (slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites (status) WHERE deleted_at IS NULL;

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_azure_entra_id ON users (azure_entra_id) WHERE azure_entra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_azure_object_id ON users (azure_object_id) WHERE azure_object_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_auth_method ON users (auth_method);
CREATE INDEX IF NOT EXISTS idx_users_account_enabled ON users (account_enabled) WHERE account_enabled = true;

-- Post indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_site_id ON posts (site_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts (slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts (published) WHERE published = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts (published_at DESC) WHERE published = true AND deleted_at IS NULL;

-- Azure config indexes
CREATE INDEX IF NOT EXISTS idx_azure_entra_config_active ON azure_entra_config (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_azure_entra_config_tenant_id ON azure_entra_config (tenant_id);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- =============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER IF NOT EXISTS trigger_update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS trigger_update_azure_entra_config_updated_at
    BEFORE UPDATE ON azure_entra_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DEFAULT DATA
-- =============================================================================

-- Insert default customer and site
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
    ON CONFLICT (email) DO NOTHING
    RETURNING id INTO default_customer_id;

    -- Get the customer ID if it already exists
    IF default_customer_id IS NULL THEN
        SELECT id INTO default_customer_id FROM customers WHERE email = 'default@agoat-publisher.com';
    END IF;

    -- Insert default site
    INSERT INTO sites (customer_id, name, slug, status, template)
    VALUES (default_customer_id, 'Default Site', 'default', 'active', 'default')
    ON CONFLICT (customer_id, slug) DO NOTHING
    RETURNING id INTO default_site_id;

    -- Get the site ID if it already exists
    IF default_site_id IS NULL THEN
        SELECT id INTO default_site_id FROM sites WHERE customer_id = default_customer_id AND slug = 'default';
    END IF;
END $$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE customers IS 'Customer accounts for multitenant architecture';
COMMENT ON TABLE sites IS 'Sites belonging to customers';
COMMENT ON TABLE users IS 'User accounts with Azure Entra ID integration';
COMMENT ON TABLE posts IS 'Content posts with tenant context';
COMMENT ON TABLE azure_entra_config IS 'Azure Entra ID configuration settings';

-- =============================================================================
-- SCHEMA VERSION TRACKING
-- =============================================================================

-- Create schema_migrations table for tracking applied migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64) NOT NULL,
    execution_time_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT
);

-- Insert record for this migration
INSERT INTO schema_migrations (version, name, checksum, status)
VALUES (1, 'initial_schema', 'initial_schema_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
