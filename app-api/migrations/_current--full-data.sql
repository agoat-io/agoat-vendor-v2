-- Current Full Data: _current--full-data.sql
-- Description: Complete data restoration script for AGoat Publisher database
-- This file contains all INSERT statements required to restore all data in the current database
-- Generated: 2025-10-02
-- 
-- Usage: This file should be used to restore all data after schema creation
-- Run this after running the schema creation scripts

-- =============================================================================
-- CUSTOMERS DATA
-- =============================================================================

INSERT INTO customers (id, name, email, status, subscription_plan, subscription_status, trial_ends_at, subscription_ends_at, max_sites, max_storage_gb, max_bandwidth_gb, created_at, updated_at, deleted_at) VALUES ('81b04b17-cb1d-4664-a158-c4f9b66a39b9', 'Default Customer', 'admin@agoat-publisher.com', 'active', 'basic', 'active', NULL, NULL, '10', '100', '1000', '2025-08-31 20:39:32.92303 +0000 +0000', '2025-08-31 20:39:32.92303 +0000 +0000', NULL) ON CONFLICT DO NOTHING;
INSERT INTO customers (id, name, email, status, subscription_plan, subscription_status, trial_ends_at, subscription_ends_at, max_sites, max_storage_gb, max_bandwidth_gb, created_at, updated_at, deleted_at) VALUES ('ac8767d1-f9c0-48ad-9f25-6eac42c4994a', 'Default Customer', 'default@agoat-publisher.com', 'active', 'basic', 'active', NULL, NULL, '10', '100', '1000', '2025-08-31 19:40:33.770666 +0000 +0000', '2025-08-31 19:40:33.770666 +0000 +0000', NULL) ON CONFLICT DO NOTHING;
-- 2 rows exported from customers

-- =============================================================================
-- SITES DATA
-- =============================================================================

INSERT INTO sites (id, customer_id, name, slug, status, template, settings, created_at, updated_at, deleted_at) VALUES ('18c6498d-f738-4c9f-aefd-d66bec11d751', 'ac8767d1-f9c0-48ad-9f25-6eac42c4994a', 'Default Site', 'default', 'active', 'default', '{}', '2025-08-31 19:40:33.770666 +0000 +0000', '2025-08-31 19:40:33.770666 +0000 +0000', NULL) ON CONFLICT DO NOTHING;
INSERT INTO sites (id, customer_id, name, slug, status, template, settings, created_at, updated_at, deleted_at) VALUES ('c36720f2-3984-4035-81f4-224c61fa0fd4', '81b04b17-cb1d-4664-a158-c4f9b66a39b9', 'Default Site', 'default-site', 'active', 'default', '{}', '2025-08-31 20:39:33.085731 +0000 +0000', '2025-08-31 20:39:33.085731 +0000 +0000', NULL) ON CONFLICT DO NOTHING;
-- 2 rows exported from sites

-- =============================================================================
-- USERS DATA
-- =============================================================================

INSERT INTO users (id, username, email, password_hash, created_at, customer_id, site_id, role, status, deleted_at, external_id, iam_provider, iam_metadata, last_iam_sync, iam_sync_status, azure_entra_id, azure_tenant_id, azure_object_id, azure_principal_name, azure_display_name, azure_given_name, azure_family_name, azure_preferred_username, access_token_hash, refresh_token_hash, token_expires_at, last_token_refresh, auth_method, email_verified, account_enabled, last_login_at, login_count, created_by_azure, azure_created_at, azure_updated_at, updated_at) VALUES ('1096773348868587521', 'admin', 'admin@example.com', '$2a$10$YPSzEDyTBtpkGvh92CLBIe6mmoGH0MpV7jJi9F/odCmKi5Toh/AF.', '2025-08-09 22:37:43.594391 +0000 +0000', 'ac8767d1-f9c0-48ad-9f25-6eac42c4994a', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'admin', 'active', NULL, NULL, 'default', '{}', NULL, 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'password', 'false', 'true', NULL, '0', 'false', NULL, NULL, '2025-09-24 04:35:29.436029 +0000 +0000') ON CONFLICT DO NOTHING;
-- 1 rows exported from users

-- =============================================================================
-- POSTS DATA
-- =============================================================================

INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1096773521492180993', '1096773348868587521', 'test & how to do all *(#)$(-these thigns', 'testtetetsetes', 'test--how-to-do-all--these-thigns', 'false', '2025-08-09 18:38:35.906599 +0000 +0000', '2025-08-09 18:38:35.906599 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1096773590622699521', '1096773348868587521', 't34t34t43', 't43t34t43t43t4t4', 't34t34t43', 'false', '2025-08-09 18:38:56.995057 +0000 +0000', '2025-08-09 18:38:56.995057 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1096773626656751617', '1096773348868587521', 't43t34t43', 't43t34t4t43', 't43t34t43', 'false', '2025-08-09 18:39:07.993719 +0000 +0000', '2025-08-09 18:39:07.993719 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1096773808508600321', '1096773348868587521', 'r2r32r', '# fewfefew

## fewfwfewfeg rgergrg gerg greg r

### fgdfgh  grgreg regergerg regerger gergerg regerg er gergegge greger
# zzzzzz', 'r2r32r', 'true', '2025-08-09 18:40:03.486348 +0000 +0000', '2025-08-17 17:45:13.15451 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1097367555325231105', '1096773348868587521', 'fefewfew', 'fewfewfew fewfewfew feeqwf fewfewe wfqfewewf efwwefwfefewefw', 'fefewfew', 'false', '2025-08-11 21:00:00.663176 +0000 +0000', '2025-08-11 21:00:00.663177 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1097367584832421889', '1096773348868587521', 'The title', '<h1>fewfew# fwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef fewfewfewfwe fwef few</h1><p></p>', 'the-title', 'true', '2025-08-11 21:00:09.672226 +0000 +0000', '2025-08-17 13:21:21.568333 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1098845459392888833', '1096773348868587521', 'testdwdwdw', 'zzzzzzzz<h2>z<strong>zzzzzzzzz zzzz</strong></h2><h1>fewfewfewfewfewfewefewfewfwfewfeefwfewfewfwf</h1><p></p><h2>wfwffeewfefwefw</h2><h2><em>fewfewfewfew</em><strong><em>fewfewfeefewfefwweffewfewfwfweewfewfewfewfewfewfwefewfweefeffewfwfeewfewfewfewffewfeweffewfewffwefwfewfewfewfewfewfewffewfewfewfweffewfwe</em></strong></h2><p></p><p>fewfewfewfewfefw</p><p>fewfewfewf</p><p>fwefweffew</p><p>fewfwfefefw</p><p></p>', 'testdwdwdw', 'true', '2025-08-17 02:17:01.1333 +0000 +0000', '2025-08-19 00:31:51.303843 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1103089467158036481', '1096773348868587521', 'Test Post with Auth Fix', 'This is a test post to verify the save functionality works with the authentication fix\.', 'test-post-with-auth-fix', 'false', '2025-09-01 02:03:09.818831 +0000 +0000', '2025-09-01 02:03:09.818831 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1103098087281426433', '1096773348868587521', 'Test Post with Logging', 'This is a test post to verify the logging functionality works.', 'test-post-with-logging', 'false', '2025-09-01 02:47:00.440495 +0000 +0000', '2025-09-01 02:47:00.440495 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
INSERT INTO posts (id, user_id, title, content, slug, published, created_at, updated_at, site_id, status, published_at, deleted_at) VALUES ('1103101398285484033', '1096773348868587521', 'Test Post with New Logging', 'This is a test post to verify the new structured logging with GUIDs works.', 'test-post-with-new-logging', 'false', '2025-09-01 03:03:50.862096 +0000 +0000', '2025-09-01 03:03:50.862096 +0000 +0000', '18c6498d-f738-4c9f-aefd-d66bec11d751', 'draft', NULL, NULL) ON CONFLICT DO NOTHING;
-- 10 rows exported from posts

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify data was inserted
SELECT 'Data Insertion Summary:' as info;
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'Sites' as table_name, COUNT(*) as count FROM sites
UNION ALL
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Posts' as table_name, COUNT(*) as count FROM posts
UNION ALL
SELECT 'CIAM Systems' as table_name, COUNT(*) as count FROM ciam_systems
UNION ALL
SELECT 'Migration Status' as table_name, COUNT(*) as count FROM migration_status;
