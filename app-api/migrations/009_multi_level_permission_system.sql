-- Migration: 009_multi_level_permission_system.sql
-- Description: Implement multi-level permission system with provider/tenant/site permissions, CIAM pools, and tenant ownership
-- Date: 2025-10-01
-- Author: AGoat Publisher Team
--
-- This migration implements:
-- 1. CIAM pool types (employee vs customer)
-- 2. Tenant ownership (saas_company vs customer)
-- 3. Multi-level permission system (provider/tenant/site)
-- 4. Site-specific CIAM configurations
-- 5. Hierarchical session management

-- =============================================================================
-- UPDATE EXISTING PLATFORM TABLES
-- =============================================================================

-- Update platform_ciam_systems to support pool types
ALTER TABLE platform_ciam_systems 
ADD COLUMN IF NOT EXISTS pool_type VARCHAR(50) NOT NULL DEFAULT 'customer' 
CHECK (pool_type IN ('employee', 'customer'));

-- Update platform_users to support pool type and provider permissions
ALTER TABLE platform_users 
ADD COLUMN IF NOT EXISTS pool_type VARCHAR(50) NOT NULL DEFAULT 'customer' 
CHECK (pool_type IN ('employee', 'customer')),
ADD COLUMN IF NOT EXISTS has_provider_permissions BOOLEAN DEFAULT false;

-- Update customers table to support tenant ownership
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS tenant_owner_type VARCHAR(50) NOT NULL DEFAULT 'customer' 
CHECK (tenant_owner_type IN ('saas_company', 'customer')),
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES platform_users(id),
ADD COLUMN IF NOT EXISTS is_shared_tenant BOOLEAN DEFAULT false;

-- Update sites table to support site-specific CIAM
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS ciam_system_id UUID REFERENCES platform_ciam_systems(id),
ADD COLUMN IF NOT EXISTS has_custom_ciam BOOLEAN DEFAULT false;

-- =============================================================================
-- NEW PLATFORM TABLES - MULTI-LEVEL PERMISSIONS
-- =============================================================================

-- Platform provider organization permissions (SaaS company employees)
CREATE TABLE platform_provider_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('full_access', 'support', 'billing', 'technical', 'read_only')),
    scope JSONB DEFAULT '{}', -- Can specify specific tenants/sites or "all"
    is_active BOOLEAN DEFAULT true,
    granted_by_user_id UUID REFERENCES platform_users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, permission_type)
);

-- Platform tenant permissions (customer owners and their team)
CREATE TABLE platform_tenant_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL, -- NO FK to customers table (cross-database ready)
    tenant_slug VARCHAR(255) NOT NULL,
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('owner', 'admin', 'member', 'viewer', 'billing')),
    permissions JSONB DEFAULT '[]', -- Specific permissions array
    is_active BOOLEAN DEFAULT true,
    granted_by_user_id UUID REFERENCES platform_users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_access_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, tenant_id)
);

-- Platform site permissions (site-specific access)
CREATE TABLE platform_site_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL, -- NO FK to sites table (cross-database ready)
    site_slug VARCHAR(255) NOT NULL,
    tenant_id UUID NOT NULL, -- For cross-database queries
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('owner', 'admin', 'editor', 'viewer', 'api_access')),
    permissions JSONB DEFAULT '[]', -- Specific permissions array
    is_active BOOLEAN DEFAULT true,
    granted_by_user_id UUID REFERENCES platform_users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_access_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, site_id)
);

-- Platform hierarchical sessions (tenant and site level)
CREATE TABLE platform_hierarchical_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('tenant', 'site')),
    tenant_id UUID, -- For tenant-level sessions
    site_id UUID,   -- For site-level sessions
    parent_session_id UUID REFERENCES platform_hierarchical_sessions(id), -- For site sessions created from tenant sessions
    session_token VARCHAR(500) NOT NULL UNIQUE,
    tenant_token VARCHAR(500), -- For site sessions, stores the parent tenant token
    ciam_system_id UUID NOT NULL REFERENCES platform_ciam_systems(id),
    provider_instance_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform permission inheritance rules
CREATE TABLE platform_permission_inheritance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_permission_type VARCHAR(50) NOT NULL CHECK (parent_permission_type IN ('provider', 'tenant', 'site')),
    child_permission_type VARCHAR(50) NOT NULL CHECK (child_permission_type IN ('tenant', 'site')),
    inheritance_rule JSONB NOT NULL, -- Rules for how permissions inherit
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(parent_permission_type, child_permission_type)
);

-- =============================================================================
-- PLATFORM INDEXES - MULTI-LEVEL PERMISSIONS
-- =============================================================================

-- Platform provider permissions indexes
CREATE INDEX idx_platform_provider_permissions_user_id ON platform_provider_permissions (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_provider_permissions_type ON platform_provider_permissions (permission_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_provider_permissions_active ON platform_provider_permissions (is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_provider_permissions_expires ON platform_provider_permissions (expires_at) WHERE deleted_at IS NULL;

-- Platform tenant permissions indexes
CREATE INDEX idx_platform_tenant_permissions_user_id ON platform_tenant_permissions (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_permissions_tenant_id ON platform_tenant_permissions (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_permissions_tenant_slug ON platform_tenant_permissions (tenant_slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_permissions_type ON platform_tenant_permissions (permission_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_tenant_permissions_active ON platform_tenant_permissions (is_active) WHERE deleted_at IS NULL;

-- Platform site permissions indexes
CREATE INDEX idx_platform_site_permissions_user_id ON platform_site_permissions (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_site_permissions_site_id ON platform_site_permissions (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_site_permissions_tenant_id ON platform_site_permissions (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_site_permissions_type ON platform_site_permissions (permission_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_site_permissions_active ON platform_site_permissions (is_active) WHERE deleted_at IS NULL;

-- Platform hierarchical sessions indexes
CREATE INDEX idx_platform_hierarchical_sessions_user_id ON platform_hierarchical_sessions (user_id);
CREATE INDEX idx_platform_hierarchical_sessions_token ON platform_hierarchical_sessions (session_token);
CREATE INDEX idx_platform_hierarchical_sessions_tenant_token ON platform_hierarchical_sessions (tenant_token);
CREATE INDEX idx_platform_hierarchical_sessions_type ON platform_hierarchical_sessions (session_type);
CREATE INDEX idx_platform_hierarchical_sessions_active ON platform_hierarchical_sessions (is_active, expires_at);
CREATE INDEX idx_platform_hierarchical_sessions_parent ON platform_hierarchical_sessions (parent_session_id);

-- Platform permission inheritance indexes
CREATE INDEX idx_platform_permission_inheritance_parent ON platform_permission_inheritance (parent_permission_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_permission_inheritance_child ON platform_permission_inheritance (child_permission_type) WHERE deleted_at IS NULL;

-- =============================================================================
-- PLATFORM FUNCTIONS - PERMISSION MANAGEMENT
-- =============================================================================

-- Function to check provider organization permissions
CREATE OR REPLACE FUNCTION check_provider_permissions(user_id_param UUID, permission_type_param VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    has_permission BOOLEAN := false;
    user_pool_type VARCHAR(50);
BEGIN
    -- Get user pool type
    SELECT pool_type INTO user_pool_type
    FROM platform_users
    WHERE id = user_id_param AND deleted_at IS NULL;
    
    -- Only employee pool users can have provider permissions
    IF user_pool_type != 'employee' THEN
        RETURN false;
    END IF;
    
    -- Check if user has provider permissions
    SELECT EXISTS(
        SELECT 1 FROM platform_provider_permissions
        WHERE user_id = user_id_param
        AND permission_type = permission_type_param
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND deleted_at IS NULL
    ) INTO has_permission;
    
    RETURN has_permission;
END $$;

-- Function to check tenant permissions
CREATE OR REPLACE FUNCTION check_tenant_permissions(user_id_param UUID, tenant_id_param UUID, permission_type_param VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    has_permission BOOLEAN := false;
    user_pool_type VARCHAR(50);
    tenant_owner_type VARCHAR(50);
BEGIN
    -- Get user pool type
    SELECT pool_type INTO user_pool_type
    FROM platform_users
    WHERE id = user_id_param AND deleted_at IS NULL;
    
    -- Get tenant owner type
    SELECT tenant_owner_type INTO tenant_owner_type
    FROM customers
    WHERE id = tenant_id_param AND deleted_at IS NULL;
    
    -- Employee pool users with provider permissions can access any tenant
    IF user_pool_type = 'employee' AND check_provider_permissions(user_id_param, 'full_access') THEN
        RETURN true;
    END IF;
    
    -- Customer pool users can only access customer-owned tenants
    IF user_pool_type = 'customer' AND tenant_owner_type != 'customer' THEN
        RETURN false;
    END IF;
    
    -- Check specific tenant permissions
    SELECT EXISTS(
        SELECT 1 FROM platform_tenant_permissions
        WHERE user_id = user_id_param
        AND tenant_id = tenant_id_param
        AND permission_type = permission_type_param
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND deleted_at IS NULL
    ) INTO has_permission;
    
    RETURN has_permission;
END $$;

-- Function to check site permissions
CREATE OR REPLACE FUNCTION check_site_permissions(user_id_param UUID, site_id_param UUID, permission_type_param VARCHAR(50))
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    has_permission BOOLEAN := false;
    user_pool_type VARCHAR(50);
    site_tenant_id UUID;
BEGIN
    -- Get user pool type
    SELECT pool_type INTO user_pool_type
    FROM platform_users
    WHERE id = user_id_param AND deleted_at IS NULL;
    
    -- Get site tenant ID
    SELECT customer_id INTO site_tenant_id
    FROM sites
    WHERE id = site_id_param AND deleted_at IS NULL;
    
    -- Employee pool users with provider permissions can access any site
    IF user_pool_type = 'employee' AND check_provider_permissions(user_id_param, 'full_access') THEN
        RETURN true;
    END IF;
    
    -- Check if user has tenant permissions for the site's tenant
    IF check_tenant_permissions(user_id_param, site_tenant_id, 'owner') THEN
        RETURN true;
    END IF;
    
    -- Check specific site permissions
    SELECT EXISTS(
        SELECT 1 FROM platform_site_permissions
        WHERE user_id = user_id_param
        AND site_id = site_id_param
        AND permission_type = permission_type_param
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
        AND deleted_at IS NULL
    ) INTO has_permission;
    
    RETURN has_permission;
END $$;

-- Function to get user's accessible tenants
CREATE OR REPLACE FUNCTION get_user_accessible_tenants(user_id_param UUID)
RETURNS TABLE(tenant_id UUID, tenant_slug VARCHAR(255), permission_type VARCHAR(50))
LANGUAGE plpgsql
AS $$
BEGIN
    -- Employee pool users with provider permissions can access all tenants
    IF check_provider_permissions(user_id_param, 'full_access') THEN
        RETURN QUERY
        SELECT c.id, c.slug, 'provider'::VARCHAR(50)
        FROM customers c
        WHERE c.deleted_at IS NULL;
    ELSE
        -- Return tenants where user has specific permissions
        RETURN QUERY
        SELECT tp.tenant_id, tp.tenant_slug, tp.permission_type
        FROM platform_tenant_permissions tp
        WHERE tp.user_id = user_id_param
        AND tp.is_active = true
        AND (tp.expires_at IS NULL OR tp.expires_at > NOW())
        AND tp.deleted_at IS NULL;
    END IF;
END $$;

-- Function to get user's accessible sites for a tenant
CREATE OR REPLACE FUNCTION get_user_accessible_sites(user_id_param UUID, tenant_id_param UUID)
RETURNS TABLE(site_id UUID, site_slug VARCHAR(255), permission_type VARCHAR(50))
LANGUAGE plpgsql
AS $$
BEGIN
    -- Employee pool users with provider permissions can access all sites
    IF check_provider_permissions(user_id_param, 'full_access') THEN
        RETURN QUERY
        SELECT s.id, s.slug, 'provider'::VARCHAR(50)
        FROM sites s
        WHERE s.customer_id = tenant_id_param
        AND s.deleted_at IS NULL;
    ELSE
        -- Return sites where user has specific permissions or tenant permissions
        RETURN QUERY
        SELECT DISTINCT s.id, s.slug, 
               COALESCE(sp.permission_type, tp.permission_type, 'tenant_access'::VARCHAR(50))
        FROM sites s
        LEFT JOIN platform_site_permissions sp ON s.id = sp.site_id 
            AND sp.user_id = user_id_param 
            AND sp.is_active = true 
            AND (sp.expires_at IS NULL OR sp.expires_at > NOW())
            AND sp.deleted_at IS NULL
        LEFT JOIN platform_tenant_permissions tp ON s.customer_id = tp.tenant_id 
            AND tp.user_id = user_id_param 
            AND tp.is_active = true 
            AND (tp.expires_at IS NULL OR tp.expires_at > NOW())
            AND tp.deleted_at IS NULL
        WHERE s.customer_id = tenant_id_param
        AND s.deleted_at IS NULL
        AND (sp.id IS NOT NULL OR tp.id IS NOT NULL);
    END IF;
END $$;

-- =============================================================================
-- INITIAL DATA - PERMISSION INHERITANCE RULES
-- =============================================================================

-- Insert default permission inheritance rules
INSERT INTO platform_permission_inheritance (parent_permission_type, child_permission_type, inheritance_rule) VALUES
('provider', 'tenant', '{"full_access": ["owner", "admin", "member", "viewer", "billing"], "support": ["viewer"], "billing": ["billing"], "technical": ["admin", "member"], "read_only": ["viewer"]}'),
('provider', 'site', '{"full_access": ["owner", "admin", "editor", "viewer", "api_access"], "support": ["viewer"], "technical": ["admin", "editor"], "read_only": ["viewer"]}'),
('tenant', 'site', '{"owner": ["owner", "admin", "editor", "viewer", "api_access"], "admin": ["admin", "editor", "viewer", "api_access"], "member": ["editor", "viewer"], "viewer": ["viewer"], "billing": ["viewer"]}')
ON CONFLICT (parent_permission_type, child_permission_type) DO NOTHING;

-- =============================================================================
-- PLATFORM COMMENTS
-- =============================================================================

COMMENT ON TABLE platform_provider_permissions IS 'Provider organization level permissions for SaaS company employees (cross-tenant access)';
COMMENT ON TABLE platform_tenant_permissions IS 'Tenant level permissions for customer owners and their team members';
COMMENT ON TABLE platform_site_permissions IS 'Site level permissions for specific site access within tenants';
COMMENT ON TABLE platform_hierarchical_sessions IS 'Hierarchical session management for tenant and site level access';
COMMENT ON TABLE platform_permission_inheritance IS 'Rules for how permissions inherit from higher levels to lower levels';

-- =============================================================================
-- MIGRATION RECORD
-- =============================================================================

INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(9, 'multi_level_permission_system', 'multi_level_permission_system_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
