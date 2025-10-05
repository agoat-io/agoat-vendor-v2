-- Migration: 005_generic_content_management.sql
-- Description: Add flexible content management tables for generic site hosting
-- Date: 2025-10-01
-- Author: AGoat Publisher Team

-- =============================================================================
-- CONTENT MANAGEMENT TABLES
-- =============================================================================

-- Site-specific pages (replaces hardcoded Thorne pages)
CREATE TABLE site_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL DEFAULT 'page' CHECK (content_type IN ('page', 'component', 'template')),
    template VARCHAR(100) DEFAULT 'default',
    content JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(site_id, slug)
);

-- Site-specific components (reusable UI components)
CREATE TABLE site_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    component_type VARCHAR(100) NOT NULL, -- 'product-grid', 'category-list', 'registration-form', etc.
    title VARCHAR(255),
    description TEXT,
    configuration JSONB NOT NULL DEFAULT '{}',
    content JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(site_id, name)
);

-- Site-specific data collections (products, categories, etc.)
CREATE TABLE site_data_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    collection_type VARCHAR(100) NOT NULL, -- 'products', 'categories', 'patients', 'orders', etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    schema JSONB NOT NULL DEFAULT '{}', -- JSON schema for validation
    metadata JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(site_id, name)
);

-- Site-specific data items (actual data for collections)
CREATE TABLE site_data_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    collection_id UUID NOT NULL REFERENCES site_data_collections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    data JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(site_id, collection_id, slug)
);

-- Site-specific navigation menus
CREATE TABLE site_navigation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    menu_type VARCHAR(50) NOT NULL DEFAULT 'main' CHECK (menu_type IN ('main', 'footer', 'sidebar', 'mobile')),
    title VARCHAR(255) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]', -- Array of menu items with links, labels, etc.
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(site_id, name)
);

-- Site-specific settings (replaces hardcoded Thorne settings)
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'general', 'appearance', 'business', 'compliance', etc.
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    data_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Whether this setting can be accessed by frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(site_id, category, key)
);

-- Site-specific API endpoints configuration
CREATE TABLE site_api_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
    handler_type VARCHAR(100) NOT NULL, -- 'data_collection', 'custom', 'static', etc.
    configuration JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    requires_auth BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(site_id, path, method)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Site pages indexes
CREATE INDEX idx_site_pages_site_id ON site_pages (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_pages_slug ON site_pages (site_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_pages_content_type ON site_pages (site_id, content_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_pages_active ON site_pages (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_site_pages_public ON site_pages (site_id, is_public) WHERE is_public = true AND deleted_at IS NULL;

-- Site components indexes
CREATE INDEX idx_site_components_site_id ON site_components (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_components_type ON site_components (site_id, component_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_components_active ON site_components (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Site data collections indexes
CREATE INDEX idx_site_data_collections_site_id ON site_data_collections (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_collections_type ON site_data_collections (site_id, collection_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_collections_active ON site_data_collections (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Site data items indexes
CREATE INDEX idx_site_data_items_site_id ON site_data_items (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_items_collection_id ON site_data_items (collection_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_items_slug ON site_data_items (site_id, collection_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_data_items_active ON site_data_items (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Site navigation indexes
CREATE INDEX idx_site_navigation_site_id ON site_navigation (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_navigation_type ON site_navigation (site_id, menu_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_navigation_active ON site_navigation (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Site settings indexes
CREATE INDEX idx_site_settings_site_id ON site_settings (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_settings_category ON site_settings (site_id, category) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_settings_public ON site_settings (site_id, is_public) WHERE is_public = true AND deleted_at IS NULL;

-- Site API endpoints indexes
CREATE INDEX idx_site_api_endpoints_site_id ON site_api_endpoints (site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_api_endpoints_path ON site_api_endpoints (site_id, path) WHERE deleted_at IS NULL;
CREATE INDEX idx_site_api_endpoints_active ON site_api_endpoints (site_id, is_active) WHERE is_active = true AND deleted_at IS NULL;

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT COLUMNS
-- =============================================================================

CREATE TRIGGER trigger_update_site_pages_updated_at
    BEFORE UPDATE ON site_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_components_updated_at
    BEFORE UPDATE ON site_components
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_data_collections_updated_at
    BEFORE UPDATE ON site_data_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_data_items_updated_at
    BEFORE UPDATE ON site_data_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_navigation_updated_at
    BEFORE UPDATE ON site_navigation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_site_api_endpoints_updated_at
    BEFORE UPDATE ON site_api_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS FOR CONTENT MANAGEMENT
-- =============================================================================

-- Function to get site page by slug
CREATE OR REPLACE FUNCTION get_site_page(site_id_param UUID, slug_param VARCHAR(255))
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    slug VARCHAR(255),
    title VARCHAR(255),
    description TEXT,
    content_type VARCHAR(50),
    template VARCHAR(100),
    content JSONB,
    metadata JSONB,
    is_active BOOLEAN,
    is_public BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.id,
        sp.name,
        sp.slug,
        sp.title,
        sp.description,
        sp.content_type,
        sp.template,
        sp.content,
        sp.metadata,
        sp.is_active,
        sp.is_public
    FROM site_pages sp
    WHERE sp.site_id = site_id_param 
    AND sp.slug = slug_param
    AND sp.is_active = true
    AND sp.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get site components by type
CREATE OR REPLACE FUNCTION get_site_components_by_type(site_id_param UUID, component_type_param VARCHAR(100))
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    component_type VARCHAR(100),
    title VARCHAR(255),
    description TEXT,
    configuration JSONB,
    content JSONB,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.name,
        sc.component_type,
        sc.title,
        sc.description,
        sc.configuration,
        sc.content,
        sc.metadata
    FROM site_components sc
    WHERE sc.site_id = site_id_param 
    AND sc.component_type = component_type_param
    AND sc.is_active = true
    AND sc.deleted_at IS NULL
    ORDER BY sc.sort_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get site data items by collection
CREATE OR REPLACE FUNCTION get_site_data_items_by_collection(site_id_param UUID, collection_name_param VARCHAR(255))
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    title VARCHAR(255),
    slug VARCHAR(255),
    data JSONB,
    metadata JSONB,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sdi.id,
        sdi.name,
        sdi.title,
        sdi.slug,
        sdi.data,
        sdi.metadata,
        sdi.sort_order
    FROM site_data_items sdi
    JOIN site_data_collections sdc ON sdi.collection_id = sdc.id
    WHERE sdi.site_id = site_id_param 
    AND sdc.name = collection_name_param
    AND sdi.is_active = true
    AND sdi.deleted_at IS NULL
    AND sdc.deleted_at IS NULL
    ORDER BY sdi.sort_order ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get site setting value
CREATE OR REPLACE FUNCTION get_site_setting(site_id_param UUID, category_param VARCHAR(100), key_param VARCHAR(255))
RETURNS JSONB AS $$
DECLARE
    setting_value JSONB;
BEGIN
    SELECT value INTO setting_value
    FROM site_settings
    WHERE site_id = site_id_param 
    AND category = category_param
    AND key = key_param
    AND deleted_at IS NULL;
    
    RETURN COALESCE(setting_value, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to get public site settings
CREATE OR REPLACE FUNCTION get_public_site_settings(site_id_param UUID)
RETURNS TABLE (
    category VARCHAR(100),
    key VARCHAR(255),
    value JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.category,
        ss.key,
        ss.value
    FROM site_settings ss
    WHERE ss.site_id = site_id_param 
    AND ss.is_public = true
    AND ss.deleted_at IS NULL
    ORDER BY ss.category, ss.key;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE COMMENTS
-- =============================================================================

COMMENT ON TABLE site_pages IS 'Site-specific pages with flexible content structure';
COMMENT ON TABLE site_components IS 'Reusable UI components for site customization';
COMMENT ON TABLE site_data_collections IS 'Data collection definitions for site-specific content';
COMMENT ON TABLE site_data_items IS 'Actual data items within collections';
COMMENT ON TABLE site_navigation IS 'Site navigation menus and structure';
COMMENT ON TABLE site_settings IS 'Site-specific configuration settings';
COMMENT ON TABLE site_api_endpoints IS 'Site-specific API endpoint configurations';

-- =============================================================================
-- MIGRATION RECORD
-- =============================================================================

INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(5, 'generic_content_management', 'generic_content_management_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
