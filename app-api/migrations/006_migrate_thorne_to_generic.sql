-- Migration: 006_migrate_thorne_to_generic.sql
-- Description: Migrate existing Thorne-specific content to generic content management system
-- Date: 2025-10-01
-- Author: AGoat Publisher Team

-- =============================================================================
-- MIGRATE THORNE CONTENT TO GENERIC FORMAT
-- =============================================================================

DO $$
DECLARE
    default_site_id UUID;
    products_collection_id UUID;
    categories_collection_id UUID;
    patients_collection_id UUID;
    orders_collection_id UUID;
BEGIN
    -- Get the default site ID
    SELECT id INTO default_site_id FROM sites WHERE slug = 'default-site' LIMIT 1;
    
    IF default_site_id IS NULL THEN
        RAISE EXCEPTION 'Default site not found';
    END IF;

    -- =============================================================================
    -- CREATE DATA COLLECTIONS
    -- =============================================================================

    -- Create products collection
    INSERT INTO site_data_collections (site_id, name, collection_type, title, description, schema, metadata)
    VALUES (
        default_site_id,
        'products',
        'products',
        'Products',
        'Product catalog for the site',
        '{
            "type": "object",
            "properties": {
                "name": {"type": "string", "required": true},
                "description": {"type": "string"},
                "category_id": {"type": "string", "required": true},
                "wholesale_price": {"type": "number", "required": true},
                "retail_price": {"type": "number", "required": true},
                "sku": {"type": "string", "required": true},
                "in_stock": {"type": "boolean", "default": true},
                "benefits": {"type": "array", "items": {"type": "string"}},
                "ingredients": {"type": "array", "items": {"type": "string"}},
                "image_url": {"type": "string"},
                "featured": {"type": "boolean", "default": false}
            }
        }'::jsonb,
        '{"display_fields": ["name", "description", "wholesale_price", "retail_price", "sku", "in_stock"]}'::jsonb
    )
    RETURNING id INTO products_collection_id;

    -- Create categories collection
    INSERT INTO site_data_collections (site_id, name, collection_type, title, description, schema, metadata)
    VALUES (
        default_site_id,
        'categories',
        'categories',
        'Categories',
        'Product categories for organization',
        '{
            "type": "object",
            "properties": {
                "name": {"type": "string", "required": true},
                "description": {"type": "string"},
                "icon": {"type": "string"},
                "benefits": {"type": "array", "items": {"type": "string"}},
                "color": {"type": "string"},
                "image_url": {"type": "string"}
            }
        }'::jsonb,
        '{"display_fields": ["name", "description", "icon", "color"]}'::jsonb
    )
    RETURNING id INTO categories_collection_id;

    -- Create patients collection
    INSERT INTO site_data_collections (site_id, name, collection_type, title, description, schema, metadata)
    VALUES (
        default_site_id,
        'patients',
        'patients',
        'Patients',
        'Patient registration and management',
        '{
            "type": "object",
            "properties": {
                "name": {"type": "string", "required": true},
                "email": {"type": "string", "required": true},
                "health_goals": {"type": "string"},
                "status": {"type": "string", "enum": ["pending", "approved", "rejected"], "default": "pending"},
                "registration_date": {"type": "string", "format": "date-time"},
                "notes": {"type": "string"}
            }
        }'::jsonb,
        '{"display_fields": ["name", "email", "health_goals", "status"]}'::jsonb
    )
    RETURNING id INTO patients_collection_id;

    -- Create orders collection
    INSERT INTO site_data_collections (site_id, name, collection_type, title, description, schema, metadata)
    VALUES (
        default_site_id,
        'orders',
        'orders',
        'Orders',
        'Order management and tracking',
        '{
            "type": "object",
            "properties": {
                "patient_id": {"type": "string", "required": true},
                "product_id": {"type": "string", "required": true},
                "quantity": {"type": "number", "required": true},
                "status": {"type": "string", "enum": ["pending", "processing", "shipped", "delivered", "cancelled"], "default": "pending"},
                "order_date": {"type": "string", "format": "date-time"},
                "total_amount": {"type": "number"},
                "shipping_address": {"type": "object"},
                "notes": {"type": "string"}
            }
        }'::jsonb,
        '{"display_fields": ["patient_id", "product_id", "quantity", "status", "order_date"]}'::jsonb
    )
    RETURNING id INTO orders_collection_id;

    -- =============================================================================
    -- CREATE SAMPLE CATEGORIES
    -- =============================================================================

    INSERT INTO site_data_items (site_id, collection_id, name, title, slug, data, metadata)
    VALUES 
    (default_site_id, categories_collection_id, 'immune-support', 'Immune Support', 'immune-support', 
     '{"name": "Immune Support", "description": "Products to support your immune system", "icon": "shield", "benefits": ["Enhanced immunity", "Antioxidant support", "Natural ingredients"], "color": "blue"}'::jsonb,
     '{"featured": true, "sort_order": 1}'::jsonb),
    
    (default_site_id, categories_collection_id, 'digestive-health', 'Digestive Health', 'digestive-health',
     '{"name": "Digestive Health", "description": "Support for digestive wellness", "icon": "heart", "benefits": ["Improved digestion", "Gut health", "Probiotic support"], "color": "green"}'::jsonb,
     '{"featured": true, "sort_order": 2}'::jsonb),
    
    (default_site_id, categories_collection_id, 'energy-vitality', 'Energy & Vitality', 'energy-vitality',
     '{"name": "Energy & Vitality", "description": "Boost your energy and vitality", "icon": "zap", "benefits": ["Increased energy", "Better focus", "Enhanced performance"], "color": "orange"}'::jsonb,
     '{"featured": true, "sort_order": 3}'::jsonb);

    -- =============================================================================
    -- CREATE SAMPLE PRODUCTS
    -- =============================================================================

    INSERT INTO site_data_items (site_id, collection_id, name, title, slug, data, metadata)
    VALUES 
    (default_site_id, products_collection_id, 'basic-b-vitamins', 'Basic B Vitamins', 'basic-b-vitamins',
     '{"name": "Basic B Vitamins", "description": "Essential B vitamins for energy and metabolism", "category_id": "energy-vitality", "wholesale_price": 25.00, "retail_price": 35.00, "sku": "THR-BVIT-001", "in_stock": true, "benefits": ["Energy support", "Metabolism boost", "Stress relief"], "ingredients": ["B1", "B2", "B6", "B12", "Folate"], "featured": true}'::jsonb,
     '{"sort_order": 1}'::jsonb),
    
    (default_site_id, products_collection_id, 'vitamin-d3', 'Vitamin D3', 'vitamin-d3',
     '{"name": "Vitamin D3", "description": "High-potency vitamin D3 for immune support", "category_id": "immune-support", "wholesale_price": 18.00, "retail_price": 28.00, "sku": "THR-D3-001", "in_stock": true, "benefits": ["Immune support", "Bone health", "Mood support"], "ingredients": ["Vitamin D3", "MCT Oil"], "featured": true}'::jsonb,
     '{"sort_order": 2}'::jsonb),
    
    (default_site_id, products_collection_id, 'probiotic-complete', 'Probiotic Complete', 'probiotic-complete',
     '{"name": "Probiotic Complete", "description": "Comprehensive probiotic for digestive health", "category_id": "digestive-health", "wholesale_price": 32.00, "retail_price": 45.00, "sku": "THR-PROB-001", "in_stock": true, "benefits": ["Digestive support", "Gut health", "Immune function"], "ingredients": ["Lactobacillus", "Bifidobacterium", "Prebiotics"], "featured": true}'::jsonb,
     '{"sort_order": 3}'::jsonb);

    -- =============================================================================
    -- CREATE SITE PAGES
    -- =============================================================================

    INSERT INTO site_pages (site_id, name, slug, title, description, content_type, template, content, metadata)
    VALUES 
    (default_site_id, 'Education', 'thorne/education', 'Education Center', 'Learn about our products and health topics', 'page', 'thorne-education',
     '{"sections": [{"type": "hero", "title": "Education Center", "subtitle": "Learn about health and wellness"}, {"type": "categories", "title": "Product Categories"}]}'::jsonb,
     '{"featured": true, "show_in_nav": true}'::jsonb),
    
    (default_site_id, 'Registration', 'thorne/register', 'Patient Registration', 'Register as a new patient', 'page', 'thorne-registration',
     '{"sections": [{"type": "form", "title": "Patient Registration", "fields": ["name", "email", "health_goals"]}]}'::jsonb,
     '{"featured": true, "show_in_nav": true}'::jsonb),
    
    (default_site_id, 'Patient Portal', 'thorne/portal', 'Patient Portal', 'Access your patient portal', 'page', 'thorne-portal',
     '{"sections": [{"type": "dashboard", "title": "Patient Portal", "widgets": ["orders", "products", "profile"]}]}'::jsonb,
     '{"featured": true, "show_in_nav": true, "requires_auth": true}'::jsonb),
    
    (default_site_id, 'Compliance', 'thorne/compliance', 'Compliance Information', 'Important compliance and legal information', 'page', 'thorne-compliance',
     '{"sections": [{"type": "content", "title": "Compliance Information", "content": "Important legal and compliance information"}]}'::jsonb,
     '{"featured": true, "show_in_nav": true}'::jsonb);

    -- =============================================================================
    -- CREATE SITE COMPONENTS
    -- =============================================================================

    INSERT INTO site_components (site_id, name, component_type, title, description, configuration, content, metadata)
    VALUES 
    (default_site_id, 'product-grid', 'product-grid', 'Product Grid', 'Display products in a grid layout',
     '{"columns": 3, "show_prices": true, "show_benefits": true, "filter_by_category": true}'::jsonb,
     '{"template": "product-card", "pagination": true}'::jsonb,
     '{"reusable": true}'::jsonb),
    
    (default_site_id, 'category-list', 'category-list', 'Category List', 'Display product categories',
     '{"layout": "grid", "show_icons": true, "show_descriptions": true}'::jsonb,
     '{"template": "category-card"}'::jsonb,
     '{"reusable": true}'::jsonb),
    
    (default_site_id, 'registration-form', 'registration-form', 'Patient Registration Form', 'Form for patient registration',
     '{"fields": ["name", "email", "health_goals"], "validation": true, "submit_action": "register_patient"}'::jsonb,
     '{"template": "form", "success_message": "Registration submitted successfully"}'::jsonb,
     '{"reusable": true}'::jsonb);

    -- =============================================================================
    -- CREATE SITE SETTINGS
    -- =============================================================================

    INSERT INTO site_settings (site_id, category, key, value, data_type, description, is_public)
    VALUES 
    -- General settings
    (default_site_id, 'general', 'site_name', '"Thorne Health Solutions"', 'string', 'Site name', true),
    (default_site_id, 'general', 'site_description', '"Professional-grade supplements and health solutions"', 'string', 'Site description', true),
    
    -- Business settings
    (default_site_id, 'business', 'practitioner_name', '"Dr. John Smith"', 'string', 'Practitioner name', true),
    (default_site_id, 'business', 'practitioner_credentials', '"MD, PhD"', 'string', 'Practitioner credentials', true),
    (default_site_id, 'business', 'contact_email', '"info@thornehealth.com"', 'string', 'Contact email', true),
    (default_site_id, 'business', 'phone', '"+1-555-0123"', 'string', 'Phone number', true),
    
    -- Address settings
    (default_site_id, 'business', 'address', '{"street": "123 Health St", "city": "Wellness City", "state": "CA", "zip": "90210"}', 'object', 'Business address', true),
    
    -- Business hours
    (default_site_id, 'business', 'business_hours', '{"monday": "9:00 AM - 5:00 PM", "tuesday": "9:00 AM - 5:00 PM", "wednesday": "9:00 AM - 5:00 PM", "thursday": "9:00 AM - 5:00 PM", "friday": "9:00 AM - 5:00 PM", "saturday": "10:00 AM - 2:00 PM", "sunday": "Closed"}', 'object', 'Business hours', true),
    
    -- Compliance settings
    (default_site_id, 'compliance', 'medical_disclaimer', '"These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease."', 'string', 'Medical disclaimer', true),
    (default_site_id, 'compliance', 'authorized_seller_notice', '"We are an authorized seller of Thorne products."', 'string', 'Authorized seller notice', true),
    (default_site_id, 'compliance', 'satisfaction_guarantee', '"30-day satisfaction guarantee on all products."', 'string', 'Satisfaction guarantee', true),
    (default_site_id, 'compliance', 'return_policy', '"Returns accepted within 30 days of purchase."', 'string', 'Return policy', true),
    
    -- Feature settings
    (default_site_id, 'features', 'enable_direct_fulfillment', 'true', 'boolean', 'Enable direct fulfillment', false),
    (default_site_id, 'features', 'enable_thorne_express', 'true', 'boolean', 'Enable Thorne Express', false),
    (default_site_id, 'features', 'require_patient_approval', 'true', 'boolean', 'Require patient approval', false),
    (default_site_id, 'features', 'show_wholesale_pricing', 'false', 'boolean', 'Show wholesale pricing', false),
    (default_site_id, 'features', 'enable_order_tracking', 'true', 'boolean', 'Enable order tracking', false);

    -- =============================================================================
    -- CREATE NAVIGATION MENUS
    -- =============================================================================

    INSERT INTO site_navigation (site_id, name, menu_type, title, items, sort_order)
    VALUES 
    (default_site_id, 'main', 'main', 'Main Navigation',
     '[
         {"label": "Home", "url": "/", "type": "link"},
         {"label": "Education", "url": "/thorne/education", "type": "link"},
         {"label": "Register", "url": "/thorne/register", "type": "link"},
         {"label": "Portal", "url": "/thorne/portal", "type": "link", "requires_auth": true},
         {"label": "Compliance", "url": "/thorne/compliance", "type": "link"}
     ]'::jsonb,
     1),
    
    (default_site_id, 'footer', 'footer', 'Footer Navigation',
     '[
         {"label": "Privacy Policy", "url": "/privacy", "type": "link"},
         {"label": "Terms of Service", "url": "/terms", "type": "link"},
         {"label": "Contact", "url": "/contact", "type": "link"},
         {"label": "Compliance", "url": "/thorne/compliance", "type": "link"}
     ]'::jsonb,
     1);

    -- =============================================================================
    -- CREATE API ENDPOINTS
    -- =============================================================================

    INSERT INTO site_api_endpoints (site_id, name, path, method, handler_type, configuration, requires_auth)
    VALUES 
    (default_site_id, 'get-products', '/api/products', 'GET', 'data_collection', '{"collection": "products", "include_metadata": true}', false),
    (default_site_id, 'get-product', '/api/products/{id}', 'GET', 'data_collection', '{"collection": "products", "by_id": true}', false),
    (default_site_id, 'get-categories', '/api/categories', 'GET', 'data_collection', '{"collection": "categories", "include_metadata": true}', false),
    (default_site_id, 'get-category', '/api/categories/{id}', 'GET', 'data_collection', '{"collection": "categories", "by_id": true}', false),
    (default_site_id, 'get-products-by-category', '/api/products/category/{id}', 'GET', 'data_collection', '{"collection": "products", "filter_by": "category_id"}', false),
    (default_site_id, 'register-patient', '/api/patients/register', 'POST', 'data_collection', '{"collection": "patients", "action": "create"}', false),
    (default_site_id, 'get-patients', '/api/patients', 'GET', 'data_collection', '{"collection": "patients", "requires_auth": true}', true),
    (default_site_id, 'get-orders', '/api/orders', 'GET', 'data_collection', '{"collection": "orders", "requires_auth": true}', true),
    (default_site_id, 'create-order', '/api/orders', 'POST', 'data_collection', '{"collection": "orders", "action": "create", "requires_auth": true}', true),
    (default_site_id, 'get-settings', '/api/settings', 'GET', 'settings', '{"public_only": true}', false),
    (default_site_id, 'search-products', '/api/products/search', 'GET', 'data_collection', '{"collection": "products", "search": true}', false);

    RAISE NOTICE 'Successfully migrated Thorne content to generic format for site ID: %', default_site_id;

END $$;

-- =============================================================================
-- MIGRATION RECORD
-- =============================================================================

INSERT INTO schema_migrations (version, name, checksum, status) VALUES
(6, 'migrate_thorne_to_generic', 'migrate_thorne_to_generic_v1_0', 'success')
ON CONFLICT (version) DO NOTHING;
