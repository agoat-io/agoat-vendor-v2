-- Migration: 010_restructure_platform_employee_tenant_admin.sql
-- Description: Restructure platform tables for employees and tenant admins, add platform roles and permissions
-- Date: 2025-10-01
-- Author: AGoat Publisher Team

-- =============================================================================
-- PLATFORM TABLE RESTRUCTURING
-- =============================================================================
-- This migration restructures platform tables to support:
-- 1. Platform users are employees and tenant admins only
-- 2. Platform user types: employee, customer_tenant_admin
-- 3. Platform roles and permissions system
-- 4. User emulation functionality for superadmins

-- =============================================================================
-- UPDATE PLATFORM USERS TABLE
-- =============================================================================

-- Update platform_users to support employee and customer_tenant_admin types
ALTER TABLE platform_users 
DROP CONSTRAINT IF EXISTS platform_users_pool_type_check;

ALTER TABLE platform_users 
ADD CONSTRAINT platform_users_pool_type_check 
CHECK (pool_type IN ('employee', 'customer_tenant_admin'));

-- Update the default value
ALTER TABLE platform_users 
ALTER COLUMN pool_type SET DEFAULT 'employee';

-- Add platform-specific fields
ALTER TABLE platform_users 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100), -- Employee ID for company employees
ADD COLUMN IF NOT EXISTS department VARCHAR(100), -- Department for employees
ADD COLUMN IF NOT EXISTS job_title VARCHAR(100), -- Job title for employees
ADD COLUMN IF NOT EXISTS manager_user_id UUID REFERENCES platform_users(id), -- Manager for employees
ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT false, -- Superadmin flag for user emulation
ADD COLUMN IF NOT EXISTS last_platform_login_at TIMESTAMP WITH TIME ZONE, -- Last platform login
ADD COLUMN IF NOT EXISTS platform_login_count INTEGER DEFAULT 0; -- Platform login count

-- =============================================================================
-- PLATFORM ROLES TABLE
-- =============================================================================

-- Platform roles for employees and tenant admins
CREATE TABLE platform_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for role identification
    name VARCHAR(100) NOT NULL UNIQUE, -- Role name (e.g., 'superadmin', 'platform_admin', 'tenant_admin', 'support')
    display_name VARCHAR(255) NOT NULL, -- Human-readable role name
    description TEXT, -- Role description
    is_system_role BOOLEAN DEFAULT false, -- Whether this is a system-defined role
    permissions JSONB DEFAULT '[]', -- JSON array of permissions for this role
    is_active BOOLEAN DEFAULT true, -- Whether role is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- =============================================================================
-- PLATFORM USER ROLES TABLE
-- =============================================================================

-- Platform user role assignments
CREATE TABLE platform_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for user role assignment identification
    user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: References platform user
    role_id UUID NOT NULL REFERENCES platform_roles(id) ON DELETE CASCADE, -- References platform role
    granted_by_user_id UUID REFERENCES platform_users(id), -- User who granted this role
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When role was granted
    expires_at TIMESTAMP WITH TIME ZONE, -- When role expires (NULL = permanent)
    is_active BOOLEAN DEFAULT true, -- Whether role assignment is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp (NULL = active, timestamp = deleted)
    UNIQUE(user_id, role_id) -- Unique constraint: one role assignment per user per role
);

-- =============================================================================
-- PLATFORM PERMISSIONS TABLE
-- =============================================================================

-- Platform permissions for fine-grained access control
CREATE TABLE platform_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for permission identification
    name VARCHAR(100) NOT NULL UNIQUE, -- Permission name (e.g., 'tenant.create', 'site.manage', 'user.emulate')
    display_name VARCHAR(255) NOT NULL, -- Human-readable permission name
    description TEXT, -- Permission description
    resource_type VARCHAR(100) NOT NULL, -- Resource type (e.g., 'tenant', 'site', 'user', 'platform')
    action VARCHAR(100) NOT NULL, -- Action (e.g., 'create', 'read', 'update', 'delete', 'manage', 'emulate')
    is_system_permission BOOLEAN DEFAULT false, -- Whether this is a system-defined permission
    is_active BOOLEAN DEFAULT true, -- Whether permission is active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record last update timestamp
    deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete timestamp (NULL = active, timestamp = deleted)
);

-- =============================================================================
-- USER EMULATION TABLE
-- =============================================================================

-- User emulation sessions for superadmins
CREATE TABLE platform_user_emulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Primary key for emulation identification
    emulator_user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE, -- User Pool Identifier: Platform user doing the emulation
    emulated_user_id UUID NOT NULL, -- User Pool Identifier: User being emulated (NO FK - cross-database)
    emulated_site_id UUID NOT NULL, -- Site being emulated (NO FK - cross-database)
    emulated_tenant_id UUID NOT NULL, -- Tenant being emulated (NO FK - cross-database)
    emulation_token VARCHAR(500) NOT NULL UNIQUE, -- Unique emulation session token
    emulation_cookie_domain VARCHAR(255) NOT NULL, -- Domain for emulation cookie
    emulation_cookie_name VARCHAR(100) NOT NULL DEFAULT 'emulation_session', -- Cookie name
    emulation_cookie_value VARCHAR(500) NOT NULL, -- Cookie value
    emulation_cookie_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Cookie expiration
    ip_address VARCHAR(45), -- IP address of emulator
    user_agent TEXT, -- User agent of emulator
    emulation_reason TEXT, -- Reason for emulation (audit trail)
    is_active BOOLEAN DEFAULT true, -- Whether emulation is active
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When emulation started
    ended_at TIMESTAMP WITH TIME ZONE, -- When emulation ended
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last activity in emulation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Record creation timestamp
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() -- Record last update timestamp
);

-- =============================================================================
-- PLATFORM INDEXES
-- =============================================================================

-- Platform roles indexes
CREATE INDEX idx_platform_roles_name ON platform_roles (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_roles_active ON platform_roles (is_active) WHERE deleted_at IS NULL;

-- Platform user roles indexes
CREATE INDEX idx_platform_user_roles_user_id ON platform_user_roles (user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_user_roles_role_id ON platform_user_roles (role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_user_roles_active ON platform_user_roles (is_active) WHERE deleted_at IS NULL;

-- Platform permissions indexes
CREATE INDEX idx_platform_permissions_name ON platform_permissions (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_permissions_resource_type ON platform_permissions (resource_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_permissions_action ON platform_permissions (action) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_permissions_active ON platform_permissions (is_active) WHERE deleted_at IS NULL;

-- User emulation indexes
CREATE INDEX idx_platform_user_emulations_emulator_user_id ON platform_user_emulations (emulator_user_id);
CREATE INDEX idx_platform_user_emulations_emulated_user_id ON platform_user_emulations (emulated_user_id);
CREATE INDEX idx_platform_user_emulations_emulated_site_id ON platform_user_emulations (emulated_site_id);
CREATE INDEX idx_platform_user_emulations_token ON platform_user_emulations (emulation_token);
CREATE INDEX idx_platform_user_emulations_active ON platform_user_emulations (is_active, started_at);

-- Platform users additional indexes
CREATE INDEX idx_platform_users_employee_id ON platform_users (employee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_department ON platform_users (department) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_is_superadmin ON platform_users (is_superadmin) WHERE deleted_at IS NULL;
CREATE INDEX idx_platform_users_manager_user_id ON platform_users (manager_user_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- PLATFORM COMMENTS
-- =============================================================================

COMMENT ON TABLE platform_roles IS 'Platform-level roles for employees and tenant admins (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_user_roles IS 'Platform-level user role assignments (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_permissions IS 'Platform-level permissions for fine-grained access control (cross-tenant, will be moved to separate database)';
COMMENT ON TABLE platform_user_emulations IS 'User emulation sessions for superadmins (cross-tenant, will be moved to separate database)';

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Insert default platform roles
INSERT INTO platform_roles (name, display_name, description, is_system_role, permissions) VALUES
('superadmin', 'Super Administrator', 'Full platform access including user emulation', true, '["platform.*", "tenant.*", "site.*", "user.emulate"]'),
('platform_admin', 'Platform Administrator', 'Platform administration without user emulation', true, '["platform.*", "tenant.*", "site.*"]'),
('tenant_admin', 'Tenant Administrator', 'Tenant administration access', true, '["tenant.read", "site.*"]'),
('support', 'Support Agent', 'Support access for troubleshooting', true, '["tenant.read", "site.read", "user.read"]')
ON CONFLICT (name) DO NOTHING;

-- Insert default platform permissions
INSERT INTO platform_permissions (name, display_name, description, resource_type, action, is_system_permission) VALUES
-- Platform permissions
('platform.read', 'Read Platform Data', 'Read platform-level data', 'platform', 'read', true),
('platform.write', 'Write Platform Data', 'Write platform-level data', 'platform', 'write', true),
('platform.manage', 'Manage Platform', 'Manage platform configuration', 'platform', 'manage', true),
-- Tenant permissions
('tenant.read', 'Read Tenants', 'Read tenant information', 'tenant', 'read', true),
('tenant.write', 'Write Tenants', 'Write tenant information', 'tenant', 'write', true),
('tenant.create', 'Create Tenants', 'Create new tenants', 'tenant', 'create', true),
('tenant.delete', 'Delete Tenants', 'Delete tenants', 'tenant', 'delete', true),
('tenant.manage', 'Manage Tenants', 'Full tenant management', 'tenant', 'manage', true),
-- Site permissions
('site.read', 'Read Sites', 'Read site information', 'site', 'read', true),
('site.write', 'Write Sites', 'Write site information', 'site', 'write', true),
('site.create', 'Create Sites', 'Create new sites', 'site', 'create', true),
('site.delete', 'Delete Sites', 'Delete sites', 'site', 'delete', true),
('site.manage', 'Manage Sites', 'Full site management', 'site', 'manage', true),
-- User permissions
('user.read', 'Read Users', 'Read user information', 'user', 'read', true),
('user.write', 'Write Users', 'Write user information', 'user', 'write', true),
('user.emulate', 'Emulate Users', 'Emulate other users for support', 'user', 'emulate', true)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- MIGRATION RECORD
-- =============================================================================

INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(11, 'restructure_platform_employee_tenant_admin', 'restructure_platform_employee_tenant_admin_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
