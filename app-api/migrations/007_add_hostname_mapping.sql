-- Migration: 007_add_hostname_mapping.sql
-- Description: Add hostname to site_id mapping support for multi-tenant hosting
-- Date: 2025-10-01
-- Author: AGoat Publisher Team

-- =============================================================================
-- HOSTNAME MAPPING SUPPORT
-- =============================================================================

-- Add tenant_id alias to customers table for better multi-tenant terminology
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS tenant_id UUID GENERATED ALWAYS AS (id) STORED;

-- Create hostname mapping table
CREATE TABLE site_hostname_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    hostname VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    ssl_enabled BOOLEAN DEFAULT true,
    redirect_to_https BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(hostname)
);

-- Add indexes for performance
CREATE INDEX idx_site_hostname_mappings_site_id ON site_hostname_mappings (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_hostname_mappings_hostname ON site_hostname_mappings (hostname) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_hostname_mappings_active ON site_hostname_mappings (is_active) WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE site_hostname_mappings IS 'Maps hostnames to sites for multi-tenant hosting support';
COMMENT ON COLUMN site_hostname_mappings.site_id IS 'Reference to the site this hostname serves';
COMMENT ON COLUMN site_hostname_mappings.hostname IS 'The hostname/domain name (e.g., example.com, www.example.com)';
COMMENT ON COLUMN site_hostname_mappings.is_primary IS 'Whether this is the primary hostname for the site';
COMMENT ON COLUMN site_hostname_mappings.is_active IS 'Whether this hostname mapping is currently active';
COMMENT ON COLUMN site_hostname_mappings.ssl_enabled IS 'Whether SSL/TLS is enabled for this hostname';
COMMENT ON COLUMN site_hostname_mappings.redirect_to_https IS 'Whether to redirect HTTP to HTTPS for this hostname';

-- =============================================================================
-- INSERT CURRENT HOSTNAME MAPPING
-- =============================================================================

DO $$
DECLARE
    default_site_id UUID;
BEGIN
    -- Get the default site ID
    SELECT id INTO default_site_id FROM sites WHERE slug = 'default-site' LIMIT 1;
    
    IF default_site_id IS NULL THEN
        RAISE EXCEPTION 'Default site not found';
    END IF;

    -- Insert current hostname mapping
    INSERT INTO site_hostname_mappings (site_id, hostname, is_primary, is_active, ssl_enabled, redirect_to_https)
    VALUES (
        default_site_id,
        'dev.np-topvitaminsupply.com',
        true,
        true,
        true,
        true
    )
    ON CONFLICT (hostname) DO UPDATE SET
        site_id = EXCLUDED.site_id,
        is_primary = EXCLUDED.is_primary,
        is_active = EXCLUDED.is_active,
        ssl_enabled = EXCLUDED.ssl_enabled,
        redirect_to_https = EXCLUDED.redirect_to_https,
        updated_at = NOW();

    RAISE NOTICE 'Hostname mapping created for dev.np-topvitaminsupply.com -> site_id: %', default_site_id;
END $$;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get site_id by hostname
CREATE OR REPLACE FUNCTION get_site_id_by_hostname(hostname_param VARCHAR(255))
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    site_id_result UUID;
BEGIN
    SELECT site_id INTO site_id_result
    FROM site_hostname_mappings
    WHERE hostname = hostname_param
    AND is_active = true
    AND deleted_at IS NULL;
    
    RETURN site_id_result;
END $$;

-- Function to get all hostnames for a site
CREATE OR REPLACE FUNCTION get_hostnames_by_site_id(site_id_param UUID)
RETURNS TABLE(hostname VARCHAR(255), is_primary BOOLEAN, is_active BOOLEAN)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT shm.hostname, shm.is_primary, shm.is_active
    FROM site_hostname_mappings shm
    WHERE shm.site_id = site_id_param
    AND shm.deleted_at IS NULL
    ORDER BY shm.is_primary DESC, shm.created_at ASC;
END $$;

-- =============================================================================
-- MIGRATION RECORD
-- =============================================================================

INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(7, 'add_hostname_mapping', 'add_hostname_mapping_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
