-- ================================================================================
-- PRE-VALIDATION SCRIPT
-- Table: mobile_downloads
-- Purpose: Read-only validation before schema migration
-- 
-- IMPORTANT: This script is READ-ONLY and safe for production
-- It performs validation checks without modifying any data
-- ================================================================================

-- ================================================================================
-- SECTION 1: TABLE EXISTENCE CHECK
-- ================================================================================

RAISE NOTICE '=== PRE-VALIDATION: TABLE EXISTENCE ===';

-- Check if mobile_downloads table exists
SELECT 
    'table_exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'mobile_downloads' 
            AND table_schema = 'public'
        ) THEN 'PASS'
        ELSE 'FAIL'
    END as status;

-- ================================================================================
-- SECTION 2: COLUMN EXISTENCE CHECK
-- ================================================================================

RAISE NOTICE '=== PRE-VALIDATION: COLUMN EXISTENCE ===';

-- Check if businessProfileId column already exists
SELECT 
    'businessprofileid_column_exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mobile_downloads' 
            AND column_name = 'businessprofileid'
            AND table_schema = 'public'
        ) THEN 'YES'
        ELSE 'NO'
    END as status;

-- ================================================================================
-- SECTION 3: TABLE SIZE AND ROW COUNT
-- ================================================================================

RAISE NOTICE '=== PRE-VALIDATION: TABLE STATISTICS ===';

-- Get total row count
SELECT 
    'total_rows' as metric,
    COUNT(*) as value
FROM mobile_downloads;

-- Get table size information
SELECT 
    'table_size_mb' as metric,
    ROUND(pg_size_pretty(pg_total_relation_size('mobile_downloads'))::numeric, 2) as value;

-- Get detailed size breakdown
SELECT 
    'size_breakdown' as metric,
    pg_size_pretty(pg_relation_size('mobile_downloads')) as table_size,
    pg_size_pretty(pg_total_relation_size('mobile_downloads')) as total_size,
    pg_size_pretty(pg_indexes_size('mobile_downloads')) as indexes_size;

-- ================================================================================
-- SECTION 4: EXISTING INDEXES CHECK
-- ================================================================================

RAISE NOTICE '=== PRE-VALIDATION: EXISTING INDEXES ===';

-- Check if our target index already exists
SELECT 
    'target_index_exists' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'mobile_downloads' 
            AND indexname = 'idx_mobile_downloads_business_profile_downloaded_at'
            AND schemaname = 'public'
        ) THEN 'YES'
        ELSE 'NO'
    END as status;

-- Show all existing indexes on the table
SELECT 
    'existing_indexes' as check_name,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'mobile_downloads' 
AND schemaname = 'public'
ORDER BY indexname;

-- ================================================================================
-- SECTION 5: CURRENT TABLE SCHEMA
-- ================================================================================

RAISE NOTICE '=== PRE-VALIDATION: CURRENT SCHEMA ===';

-- Show current table structure
SELECT 
    'current_columns' as section,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mobile_downloads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================================
-- SECTION 6: SAMPLE DATA INSPECTION
-- ================================================================================

RAISE NOTICE '=== PRE-VALIDATION: SAMPLE DATA ===';

-- Show sample of existing data (first 5 rows)
SELECT 
    'sample_data' as section,
    id,
    mobileUserId,
    resourceType,
    resourceId,
    downloadedAt,
    createdAt
FROM mobile_downloads 
ORDER BY createdAt DESC 
LIMIT 5;

-- Check data distribution by resource type
SELECT 
    'data_distribution' as section,
    resourceType,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM mobile_downloads), 2) as percentage
FROM mobile_downloads 
GROUP BY resourceType 
ORDER BY count DESC;

-- ================================================================================
-- SECTION 7: PERFORMANCE CONSIDERATIONS
-- ================================================================================

RAISE NOTICE '=== PRE-VALIDATION: PERFORMANCE INFO ===';

-- Check for any active locks on the table
SELECT 
    'active_locks' as section,
    pid,
    mode,
    granted,
    query
FROM pg_locks 
JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
WHERE pg_locks.relation = 'mobile_downloads'::regclass
AND pg_locks.pid <> pg_backend_pid();

-- Check recent query activity on this table
SELECT 
    'recent_activity' as section,
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements 
WHERE query LIKE '%mobile_downloads%'
ORDER BY total_time DESC
LIMIT 5;

-- ================================================================================
-- SECTION 8: MIGRATION READINESS SUMMARY
-- ================================================================================

RAISE NOTICE '=== PRE-VALIDATION: READINESS SUMMARY ===';

SELECT 
    'migration_readiness' as section,
    'mobile_downloads' as table_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mobile_downloads' AND table_schema = 'public')
        THEN 'TABLE_EXISTS'
        ELSE 'TABLE_MISSING'
    END as table_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'mobile_downloads' 
            AND column_name = 'businessprofileid'
            AND table_schema = 'public'
        ) THEN 'COLUMN_ALREADY_EXISTS'
        ELSE 'COLUMN_MISSING'
    END as column_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'mobile_downloads' 
            AND indexname = 'idx_mobile_downloads_business_profile_downloaded_at'
            AND schemaname = 'public'
        ) THEN 'INDEX_ALREADY_EXISTS'
        ELSE 'INDEX_MISSING'
    END as index_status;

RAISE NOTICE '=== PRE-VALIDATION COMPLETED ===';
RAISE NOTICE 'Review the results above before proceeding with schema migration';
RAISE NOTICE 'Ensure you have a recent database backup before proceeding';
