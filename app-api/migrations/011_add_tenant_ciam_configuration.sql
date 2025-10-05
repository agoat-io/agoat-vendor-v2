-- Migration: 011_add_tenant_ciam_configuration.sql
-- Description: Add CIAM configuration to tenant (customers) table
-- Date: 2025-10-01
-- Author: AGoat Publisher Team

-- Add CIAM configuration fields to customers table (tenants)
ALTER TABLE customers 
ADD COLUMN ciam_system_id UUID REFERENCES platform_ciam_systems(id),
ADD COLUMN has_custom_ciam BOOLEAN DEFAULT false,
ADD COLUMN ciam_settings JSONB DEFAULT '{}';

-- Add comment explaining the new fields
COMMENT ON COLUMN customers.ciam_system_id IS 'References CIAM system for tenant-level authentication (overrides platform default)';
COMMENT ON COLUMN customers.has_custom_ciam IS 'Whether this tenant has custom CIAM configuration';
COMMENT ON COLUMN customers.ciam_settings IS 'Tenant-specific CIAM settings and configuration';

-- Create index for performance
CREATE INDEX idx_customers_ciam_system_id ON customers(ciam_system_id);

-- Update migration tracking
INSERT INTO migration_history (version, filename, applied_at, description) 
VALUES (11, '011_add_tenant_ciam_configuration.sql', NOW(), 'Add CIAM configuration to tenant (customers) table');
