-- Mark migration 2 as applied
INSERT INTO schema_migrations (version, applied_at) 
VALUES (2, current_timestamp())
ON CONFLICT (version) DO UPDATE SET applied_at = current_timestamp();
