# Database Migration Status

**Date:** 2025-10-04  
**Status:** ✅ Migration files updated to match real database schema

## ⚠️ IMPORTANT: Real Database Analysis

The migration files have been updated to match the **actual database schema** that the API is using. The real database has evolved beyond what the original migration files represented.

**See `MIGRATION-STATUS-REAL.md` for detailed analysis of the real database state.**

## Migration Files (In Order)

1. **001_initial_schema.sql** - Base tables and Azure Entra ID support
2. **002_cognito_ciam_support.sql** - Cognito and multi-CIAM support
3. **003_oidc_agnostic_ciam_support.sql** - OIDC-agnostic CIAM system
4. **004_remove_cognito_backward_compatibility.sql** - Remove backward compatibility
5. **005_generic_content_management.sql** - Generic content management system (adds site_pages, site_components, site_data_collections, site_data_items, site_navigation, site_settings, site_api_endpoints tables)
6. **005a_support_multiple_providers_same_type.sql** - Support multiple CIAM providers of same type (adds provider_instance_id and related columns to ciam_systems)
7. **006_migrate_thorne_to_generic.sql** - Migrate Thorne content to generic format (data migration - populates generic content tables)
8. **007_add_hostname_mapping.sql** - Add hostname to site_id mapping for multi-tenant hosting (adds site_hostname_mappings table and helper functions)
9. **008_create_platform_tables.sql** - Create platform tables for cross-tenant functionality (adds 8 platform_ prefixed tables for auth, users, database connections, keyvault)
10. **009_add_comprehensive_schema_comments.sql** - Add comprehensive comments to all SQL schema definitions including user pool and app client identifiers
11. **009_multi_level_permission_system.sql** - Implement multi-level permission system (adds 5 permission tables, CIAM pools, tenant ownership, hierarchical sessions)
12. **010_restructure_platform_employee_tenant_admin.sql** - Restructure platform tables for employees and tenant admins, add platform roles and permissions
13. **011_add_tenant_ciam_configuration.sql** - Add CIAM configuration to tenant (customers) table
14. **012_real_database_schema.sql** - Document the real database schema that the API is using
15. **013_align_with_real_database.sql** - Align migration files with real database schema
16. **AUTH-UNIQUE-IDENTIFIERS.md** - Authentication unique identifiers reference documentation

## Recent Changes (2025-10-04)

### ✅ Updated Migration Files to Match Real Database (2025-10-04)
- **Analysis:** Analyzed the actual database schema that the API is using
- **Discovery:** Real database has evolved beyond migration files
- **Action:** Updated migration files to match reality
- **Files Created:**
  - `012_real_database_schema.sql` - Documents real database state
  - `_current--real-schema.sql` - Real database schema definition
  - `013_align_with_real_database.sql` - Alignment migration
  - `MIGRATION-STATUS-REAL.md` - Detailed real database analysis
  - `AUTH-UNIQUE-IDENTIFIERS.md` - Authentication unique identifiers reference
- **Key Changes:**
  - Primary keys use `BIGINT` with `unique_rowid()` (CockroachDB optimized)
  - Users table has both legacy and modern authentication fields
  - Posts table has multi-tenant support with `site_id`
  - Full multi-tenant architecture with customers and sites tables
  - Complete CIAM system with OIDC/OAuth2 support
  - Added `auth_unique: <meaning>` comments to mark unique identity provider services and pools
- **Impact:** Migration files now accurately represent the working database schema with proper authentication identifier documentation

## Recent Changes (2025-10-01)

### ✅ Added Tenant CIAM Configuration (2025-10-01 16:30)
- **Feature:** Add CIAM configuration to tenant (customers) table
- **Files Created:**
  - `011_add_tenant_ciam_configuration.sql` - Migration script
- **Changes:**
  - Added `ciam_system_id` field to customers table to reference tenant-level CIAM system
  - Added `has_custom_ciam` boolean field to indicate custom CIAM configuration
  - Added `ciam_settings` JSONB field for tenant-specific CIAM settings
  - Created index on `ciam_system_id` for performance
  - Updated full schema documentation
- **Impact:** Enables tenant-level CIAM configuration, allowing each tenant to have its own authentication system

### ✅ Added Comprehensive Schema Comments (2025-10-01 14:30)
- **Feature:** Comprehensive comments to all SQL schema definitions including user pool and app client identifiers
- **Files Created:**
  - `009_add_comprehensive_schema_comments.sql` - Migration script
  - `/docs/code-change-history/2025-10-01-14-30-add-comprehensive-schema-comments.md` - Change documentation
- **Changes:**
  - Added comprehensive comments to all tables explaining their purpose and role
  - Added detailed comments to all columns explaining their usage and data types
  - Identified user pool unique identifiers (primary keys, emails, usernames, OIDC sub claims)
  - Identified app client unique identifiers (OAuth client IDs, JWT audience claims)
  - Added cross-database readiness indicators for platform tables
  - Enhanced documentation for maintainability and understanding
- **Impact:** Improved database schema documentation and maintainability

### ✅ Implemented Multi-Level Permission System (2025-10-01 13:45)
- **Feature:** Comprehensive multi-level permission system with provider/tenant/site permissions
- **Files Created:**
  - `009_multi_level_permission_system.sql` - Migration script
  - `/docs/requirements-and-user-stories/requirement-change-history/2025-10-01-13-30-multi-level-permission-system.md` - Requirement change request
  - `/docs/requirements-and-user-stories/final-functional/multi-level-permission-system.md` - Functional requirements
  - `/docs/code-change-history/2025-10-01-13-45-multi-level-permission-system.md` - Change documentation
- **Changes:**
  - Updated existing platform tables with CIAM pool types and tenant ownership
  - Created 5 new permission tables:
    - `platform_provider_permissions` - SaaS company employee permissions
    - `platform_tenant_permissions` - Customer owner and team permissions
    - `platform_site_permissions` - Site-specific permissions
    - `platform_hierarchical_sessions` - Tenant and site level sessions
    - `platform_permission_inheritance` - Permission inheritance rules
  - Added 5 permission management functions for validation and access control
  - Implemented CIAM pool separation (employee vs customer)
  - Added tenant ownership models (SaaS company vs customer owned)
  - Added site-specific CIAM configuration support
  - Added hierarchical session management
- **Impact:** Complete multi-tenant permission system with proper access control and security isolation

### ✅ Created Platform Tables for Multi-Tenant Architecture (2025-10-01 13:10)
- **Feature:** Platform-level tables for cross-tenant functionality
- **Files Created:**
  - `008_create_platform_tables.sql` - Migration script
  - `/docs/code-change-history/2025-10-01-13-10-create-platform-tables.md` - Change documentation
- **Changes:**
  - Created 8 platform tables with `platform_` prefix:
    - `platform_users` - Cross-tenant user accounts
    - `platform_ciam_systems` - Authentication providers
    - `platform_user_ciam_mappings` - User-to-auth mappings
    - `platform_oidc_tokens` - Authentication tokens
    - `platform_oidc_sessions` - User sessions
    - `platform_tenant_databases` - Database connection info per tenant
    - `platform_keyvault_secrets` - Keyvault secret management
    - `platform_tenant_access` - Tenant access control
  - NO foreign keys to tenant-specific tables (ready for database separation)
  - Keyvault integration for all sensitive data (connection strings, passwords, certificates)
  - Support for shared and dedicated tenant databases
- **Impact:** Platform can now support multi-tenant architecture with separate databases

### ✅ Added Hostname Mapping Support (2025-10-01 12:50)
- **Feature:** Multi-tenant hostname to site_id mapping
- **Files Created:** 
  - `007_add_hostname_mapping.sql` - Migration script
  - `/docs/code-change-history/2025-10-01-12-50-add-hostname-mapping-support.md` - Change documentation
- **Changes:**
  - Created `site_hostname_mappings` table for hostname to site_id mapping
  - Added helper functions: `get_site_id_by_hostname()` and `get_hostnames_by_site_id()`
  - Inserted current hostname mapping for `dev.np-topvitaminsupply.com`
  - Added `GetSiteByHostname()` method to content service
- **Impact:** Sites can now be resolved by hostname for true multi-tenant hosting

### ✅ Fixed Migration Order Conflict
- **Issue:** Two migrations with the same "005" prefix
- **Fix:** Renamed `005_support_multiple_providers_same_type.sql` to `005a_support_multiple_providers_same_type.sql`
- **Impact:** Migration runner will now process files in correct order

### ✅ Updated Site Slug References
- **Issue:** Migration 006 referenced 'default' site slug, but actual site uses 'default-site'
- **Fix:** Updated `006_migrate_thorne_to_generic.sql` to use 'default-site'
- **Impact:** Data migration will now correctly find and populate the default site

### ✅ Updated Schema Documentation
- **Issue:** `_current--full-schema.sql` header didn't include 005a migration
- **Fix:** Updated header to list all migrations including 005a
- **Updated:** Date changed from 2024-09-28 to 2025-10-01

## Schema Consistency

✅ **Verified:** All table definitions in migrations match the current schema file  
✅ **Verified:** All columns from 005a migration are present in current schema  
✅ **Verified:** Generic content management tables are properly defined  
✅ **Verified:** No syntax errors found in migration files

## Generic Content Management Tables

The following tables were added in migration 005 and are used by the application:

1. **site_pages** - Dynamic page definitions
2. **site_components** - Reusable UI components
3. **site_data_collections** - Data collection schemas (products, categories, etc.)
4. **site_data_items** - Actual data items in collections
5. **site_navigation** - Site navigation menus
6. **site_settings** - Site-specific settings
7. **site_api_endpoints** - Custom API endpoint configurations

## Migration Execution

To run migrations:

```bash
cd /Users/andrewsmith/Library/CloudStorage/Dropbox/projects/agoat-publisher-database/migrations

# Set database connection
export DATABASE_URL="your-connection-string-here"

# Run all pending migrations
./run_migrations.sh run

# Check migration status
./run_migrations.sh status

# List available migrations
./run_migrations.sh list
```

## Next Steps

1. **Verify Database State:** Check if the current database has all tables and data
2. **Run Missing Migrations:** If any migrations haven't been applied, run them
3. **Populate Test Data:** Ensure the default site has navigation, settings, and pages

## Notes

- Migration 006 is a **data migration** that populates the generic content tables with initial data
- The site slug **must** be 'default-site' for the data migration to work
- All migrations use `DO $$` blocks for proper error handling
- Migration files include `ON CONFLICT DO NOTHING` clauses to prevent duplicate entries

