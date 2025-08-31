# ADR 00002: Index Optimization Analysis for Multitenancy

## Status
Proposed

## Context
The initial multitenancy migration created 49 indexes, raising concerns about storage overhead and maintenance costs. CockroachDB, like other databases, must maintain all indexes during writes, which impacts performance and storage.

## Analysis

### Original Design (49 indexes)
- **Storage Impact**: Each index can use 10-30% of table size
- **Write Performance**: Each INSERT/UPDATE must update all relevant indexes
- **Maintenance Overhead**: More indexes = more background maintenance work
- **Estimated Storage**: ~500-1500% of base table size in indexes

### Optimized Design (13 indexes - 73% reduction)
- **Storage Impact**: Reduced to essential indexes only
- **Write Performance**: Fewer indexes to update = faster writes
- **Query Performance**: All critical access patterns still covered
- **Estimated Storage**: ~150-400% of base table size in indexes

## Decision

Adopt the optimized index strategy that reduces index count by 73% while maintaining query performance for critical access patterns.

## Optimization Strategies Applied

### 1. Leverage UNIQUE Constraints
```sql
-- BEFORE: UNIQUE constraint + separate index
UNIQUE(customer_id, slug)
CREATE INDEX idx_sites_customer_id ON sites (customer_id);

-- AFTER: UNIQUE constraint provides the index
UNIQUE(customer_id, slug)  -- This creates an index automatically
```

### 2. Composite Indexes for Multiple Patterns
```sql
-- BEFORE: Multiple separate indexes
CREATE INDEX idx_customers_status ON customers (status);
CREATE INDEX idx_customers_subscription_status ON customers (subscription_status);

-- AFTER: Single composite index
CREATE INDEX idx_customers_status_subscription ON customers (status, subscription_status);
```

### 3. Remove Low-Value Indexes
```sql
-- REMOVED: Rarely queried in isolation
CREATE INDEX idx_customers_created_at ON customers (created_at);
CREATE INDEX idx_customers_deleted_at ON customers (deleted_at);
```

### 4. Partial Indexes for Active Records
```sql
-- Optimized: Only index active records
CREATE INDEX idx_posts_site_published ON posts (site_id, published_at DESC) 
    WHERE status = 'published' AND deleted_at IS NULL;
```

## Index Reduction by Table

| Table | Original Indexes | Optimized Indexes | Reduction |
|-------|-----------------|-------------------|-----------|
| customers | 4 | 1 | 75% |
| sites | 4 | 1 | 75% |
| domains | 6 | 2 | 67% |
| users | 7 | 2 | 71% |
| posts | 4 | 2 | 50% |
| tenant_usage | 3 | 1 | 67% |
| audit_logs | 4 | 2 | 50% |
| iam_providers | 4 | 0* | 100% |
| iam_user_mappings | 5 | 1 | 80% |
| iam_group_mappings | 5 | 0* | 100% |
| site_settings | 3 | 1 | 67% |
| **TOTAL** | **49** | **13** | **73%** |

*Using UNIQUE constraint indexes only

## Performance Impact Analysis

### Queries Still Optimized ✅
1. **Tenant Scoping**: `WHERE customer_id = ? AND status = ?`
2. **Site Queries**: `WHERE site_id = ? AND status = ?`
3. **Published Posts**: `WHERE site_id = ? AND status = 'published' ORDER BY published_at DESC`
4. **User Auth**: `WHERE external_id = ?` (via UNIQUE)
5. **Audit Logs**: `WHERE customer_id = ? ORDER BY created_at DESC`

### Queries Slightly Slower ⚠️
1. **Deleted Records**: `WHERE deleted_at IS NOT NULL` (rare operation)
2. **All Records by Date**: `ORDER BY created_at` without other filters (admin operation)
3. **Individual Status Filters**: Single status queries without customer context (uncommon)

## Storage Savings Calculation

### Before Optimization
- Base tables: ~100GB (estimated for 10,000 customers)
- Index storage: ~500-1500GB (49 indexes)
- Total: ~600-1600GB

### After Optimization
- Base tables: ~100GB (unchanged)
- Index storage: ~150-400GB (13 indexes)
- Total: ~250-500GB
- **Savings: 58-69% total storage reduction**

## CockroachDB Specific Benefits

### Distributed Performance
- **Fewer Raft Consensus**: Each index requires consensus across nodes
- **Reduced Network Traffic**: Less index data to replicate
- **Faster Splits**: Tables split faster with fewer indexes
- **Better Cache Utilization**: More important data fits in memory

### Write Performance
- **Faster Inserts**: 73% fewer indexes to update
- **Reduced Contention**: Less lock contention on index updates
- **Better Throughput**: Higher write throughput possible

## Recommendations

### Use Optimized Version For:
- ✅ New deployments
- ✅ High-volume applications
- ✅ Cost-sensitive deployments
- ✅ Write-heavy workloads

### Consider Original Version For:
- ⚠️ Read-heavy workloads with diverse query patterns
- ⚠️ Applications with complex reporting needs
- ⚠️ When storage cost is not a concern

## Migration Path

### From Original to Optimized
```sql
-- Drop redundant indexes
DROP INDEX idx_customers_status;
DROP INDEX idx_customers_subscription_status;
DROP INDEX idx_customers_created_at;
DROP INDEX idx_customers_deleted_at;
-- ... (continue for all redundant indexes)

-- Create new composite indexes
CREATE INDEX idx_customers_status_subscription ON customers (status, subscription_status) WHERE deleted_at IS NULL;
-- ... (continue for new indexes)
```

## Monitoring Strategy

### Key Metrics to Watch
1. **Query Performance**: Monitor slow query log
2. **Index Usage**: Track which indexes are actually used
3. **Storage Growth**: Monitor index size vs table size ratio
4. **Write Latency**: Track INSERT/UPDATE performance

### Index Usage Query
```sql
-- Check index usage in CockroachDB
SELECT 
    ti.descriptor_name as table_name,
    ti.index_name,
    ti.total_reads,
    ti.last_read
FROM crdb_internal.index_usage_statistics ti
WHERE ti.descriptor_name IN ('customers', 'sites', 'users', 'posts')
ORDER BY ti.total_reads DESC;
```

## Conclusion

The optimized index strategy provides:
- **73% reduction** in index count
- **60-70% reduction** in index storage
- **Maintained performance** for critical queries
- **Improved write performance**
- **Lower operational costs**

This optimization is recommended for production use, with monitoring to ensure query performance remains acceptable.

## References
- [CockroachDB Index Best Practices](https://www.cockroachlabs.com/docs/stable/indexes.html)
- [CockroachDB Performance Tuning](https://www.cockroachlabs.com/docs/stable/performance-tuning.html)
- [Index Overhead Analysis](https://www.cockroachlabs.com/docs/stable/index-selection.html)
