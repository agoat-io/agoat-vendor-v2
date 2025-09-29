-- =============================================================================
-- AGoat Publisher - Enhanced Multitenancy Schema
-- =============================================================================
-- This schema supports both shared database and database-per-customer approaches
-- Optimized for CockroachDB with Row-Level Security and advanced isolation
-- Date: 2025-01-15
-- Author: AGoat Publisher Team

-- =============================================================================
-- TENANT ISOLATION CONFIGURATION
-- =============================================================================

-- Tenant isolation strategy table
CREATE TABLE tenant_isolation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    isolation_strategy VARCHAR(50) NOT NULL DEFAULT 'shared' CHECK (isolation_strategy IN ('shared', 'database', 'hybrid')),
    database_name VARCHAR(255), -- For database-per-customer approach
    region_preference VARCHAR(100), -- For data residency
    backup_retention_days INTEGER DEFAULT 30,
    compliance_level VARCHAR(50) DEFAULT 'standard' CHECK (compliance_level IN ('standard', 'enterprise', 'government')),
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    UNIQUE(customer_id)
);

-- =============================================================================
-- ROW-LEVEL SECURITY SETUP
-- =============================================================================

-- Function to get current tenant context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_customer_id', true)::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current site context
CREATE OR REPLACE FUNCTION get_current_site_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_site_id', true)::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ENHANCED BASE SCHEMA (Same as complete-schema.sql but with RLS)
-- =============================================================================

-- Users table with enhanced tenant isolation
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    site_id UUID,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'author', 'user')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    external_id VARCHAR(255) UNIQUE,
    iam_provider VARCHAR(50) DEFAULT 'default',
    iam_metadata JSONB DEFAULT '{}',
    last_iam_sync TIMESTAMP,
    iam_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (iam_sync_status IN ('pending', 'synced', 'failed', 'disabled')),
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    deleted_at TIMESTAMP,
    UNIQUE(customer_id, email)
);

-- Posts table with enhanced tenant isolation
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    updated_at TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    deleted_at TIMESTAMP,
    UNIQUE(site_id, slug)
);

-- =============================================================================
-- ROW-LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam_user_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE iam_group_mappings ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY tenant_isolation_users ON users
    FOR ALL USING (customer_id = get_current_tenant_id());

CREATE POLICY users_site_isolation ON users
    FOR ALL USING (
        site_id IS NULL OR 
        site_id = get_current_site_id() OR
        EXISTS (
            SELECT 1 FROM sites s 
            WHERE s.id = users.site_id 
            AND s.customer_id = get_current_tenant_id()
        )
    );

-- Posts table policies
CREATE POLICY tenant_isolation_posts ON posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sites s 
            WHERE s.id = posts.site_id 
            AND s.customer_id = get_current_tenant_id()
        )
    );

CREATE POLICY posts_site_isolation ON posts
    FOR ALL USING (site_id = get_current_site_id());

-- Sites table policies
CREATE POLICY tenant_isolation_sites ON sites
    FOR ALL USING (customer_id = get_current_tenant_id());

-- Domains table policies
CREATE POLICY tenant_isolation_domains ON domains
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sites s 
            WHERE s.id = domains.site_id 
            AND s.customer_id = get_current_tenant_id()
        )
    );

-- Tenant usage policies
CREATE POLICY tenant_isolation_usage ON tenant_usage
    FOR ALL USING (customer_id = get_current_tenant_id());

-- Audit logs policies (allow cross-tenant for admin operations)
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    FOR ALL USING (
        customer_id = get_current_tenant_id() OR
        current_setting('app.is_admin', true)::BOOLEAN = true
    );

-- IAM policies
CREATE POLICY tenant_isolation_iam_providers ON iam_providers
    FOR ALL USING (customer_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_iam_user_mappings ON iam_user_mappings
    FOR ALL USING (customer_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_iam_group_mappings ON iam_group_mappings
    FOR ALL USING (customer_id = get_current_tenant_id());

-- =============================================================================
-- DATABASE PER CUSTOMER SUPPORT
-- =============================================================================

-- Function to create database for a customer
CREATE OR REPLACE FUNCTION create_customer_database(customer_uuid UUID, customer_name TEXT)
RETURNS TEXT AS $$
DECLARE
    db_name TEXT;
    sql_command TEXT;
BEGIN
    -- Generate safe database name
    db_name := 'agoat_publish_customer_' || customer_uuid::TEXT;
    
    -- Create database
    sql_command := 'CREATE DATABASE IF NOT EXISTS ' || quote_ident(db_name);
    EXECUTE sql_command;
    
    -- Update tenant isolation config
    INSERT INTO tenant_isolation_config (customer_id, isolation_strategy, database_name)
    VALUES (customer_uuid, 'database', db_name)
    ON CONFLICT (customer_id) 
    DO UPDATE SET 
        isolation_strategy = 'database',
        database_name = db_name,
        updated_at = current_timestamp();
    
    RETURN db_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to migrate customer to separate database
CREATE OR REPLACE FUNCTION migrate_customer_to_separate_db(customer_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    db_name TEXT;
    migration_sql TEXT;
BEGIN
    -- Create separate database
    db_name := create_customer_database(customer_uuid, 'Customer Migration');
    
    -- Generate migration SQL (this would be executed in the new database)
    migration_sql := format('
        -- Migration script for customer %s to database %s
        -- This would be executed in the new database context
        -- Copy schema and data for the specific customer
    ', customer_uuid, db_name);
    
    RETURN db_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TENANT CONTEXT MANAGEMENT
-- =============================================================================

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(customer_uuid UUID, site_uuid UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_customer_id', customer_uuid::TEXT, false);
    IF site_uuid IS NOT NULL THEN
        PERFORM set_config('app.current_site_id', site_uuid::TEXT, false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear tenant context
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_customer_id', '', false);
    PERFORM set_config('app.current_site_id', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- MONITORING AND ANALYTICS
-- =============================================================================

-- Enhanced tenant usage tracking
CREATE TABLE tenant_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit VARCHAR(50),
    collection_time TIMESTAMP NOT NULL DEFAULT current_timestamp(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(customer_id, metric_type, metric_name, collection_time)
);

-- Cross-tenant analytics (admin only)
CREATE TABLE cross_tenant_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_type VARCHAR(100) NOT NULL,
    analysis_period VARCHAR(50) NOT NULL,
    total_customers INTEGER NOT NULL,
    total_sites INTEGER NOT NULL,
    total_users INTEGER NOT NULL,
    total_posts INTEGER NOT NULL,
    avg_performance_score DECIMAL(5,2),
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- =============================================================================
-- COMPLIANCE AND AUDIT ENHANCEMENTS
-- =============================================================================

-- Data residency tracking
CREATE TABLE data_residency_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(50) NOT NULL,
    source_region VARCHAR(100),
    target_region VARCHAR(100),
    compliance_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT current_timestamp()
);

-- Enhanced audit logging with compliance
CREATE OR REPLACE FUNCTION log_audit_event(
    p_customer_id UUID,
    p_site_id UUID,
    p_user_id UUID,
    p_resource_type VARCHAR(100),
    p_resource_id UUID,
    p_action VARCHAR(100),
    p_details JSONB DEFAULT '{}',
    p_compliance_level VARCHAR(50) DEFAULT 'standard'
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        customer_id, site_id, user_id, resource_type, resource_id, 
        action, details, ip_address, user_agent
    ) VALUES (
        p_customer_id, p_site_id, p_user_id, p_resource_type, p_resource_id,
        p_action, p_details, 
        current_setting('app.client_ip', true)::INET,
        current_setting('app.user_agent', true)
    ) RETURNING id INTO audit_id;
    
    -- Log data residency if needed
    IF p_compliance_level IN ('enterprise', 'government') THEN
        INSERT INTO data_residency_logs (
            customer_id, table_name, record_id, operation, 
            source_region, target_region
        ) VALUES (
            p_customer_id, p_resource_type, p_resource_id, p_action,
            current_setting('app.source_region', true),
            current_setting('app.target_region', true)
        );
    END IF;
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- INDEXES AND PERFORMANCE
-- =============================================================================

-- Enhanced indexes for tenant isolation
CREATE INDEX idx_users_tenant_context ON users (customer_id, site_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_tenant_context ON posts (site_id, status, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_audit_logs_tenant_time ON audit_logs (customer_id, created_at DESC);
CREATE INDEX idx_tenant_performance_metrics_time ON tenant_performance_metrics (customer_id, collection_time DESC);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE tenant_isolation_config IS 'Configuration for tenant isolation strategy (shared vs database-per-customer)';
COMMENT ON FUNCTION get_current_tenant_id() IS 'Get current tenant context for RLS policies';
COMMENT ON FUNCTION set_tenant_context(UUID, UUID) IS 'Set tenant context for current session';
COMMENT ON FUNCTION create_customer_database(UUID, TEXT) IS 'Create separate database for customer isolation';
COMMENT ON TABLE tenant_performance_metrics IS 'Enhanced performance metrics per tenant';
COMMENT ON TABLE data_residency_logs IS 'Data residency compliance tracking';

-- =============================================================================
-- SCHEMA COMPLETE
-- =============================================================================

-- This enhanced schema supports both shared database and database-per-customer approaches
-- with advanced CockroachDB features for optimal tenant isolation and performance
