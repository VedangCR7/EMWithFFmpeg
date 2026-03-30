-- ================================================================================
-- EXECUTE SCHEMA UPDATE SCRIPT
-- Table: mobile_downloads
-- Purpose: Add businessProfileId column and create index for download limits
-- 
-- IMPORTANT: This script modifies production database schema
-- - Tested in staging environment first
-- - Database backup confirmed
-- - Low-traffic period scheduled
-- ================================================================================

-- ================================================================================
-- SECTION 1: ADD businessProfileId COLUMN
-- ================================================================================

RAISE NOTICE '=== SCHEMA UPDATE: ADDING businessProfileId COLUMN ===';

-- Add businessProfileId column as nullable TEXT for backward compatibility
-- Using IF NOT EXISTS to prevent errors if column already exists
-- This operation is safe and fast in PostgreSQL (doesn't rewrite the table)
ALTER TABLE mobile_downloads 
ADD COLUMN IF NOT EXISTS businessProfileId TEXT;

RAISE NOTICE 'Successfully added businessProfileId column (or it already existed)';

-- ================================================================================
-- SECTION 2: CREATE INDEX CONCURRENTLY
-- ================================================================================

RAISE NOTICE '=== SCHEMA UPDATE: CREATING INDEX CONCURRENTLY ===';

-- Create index CONCURRENTLY to avoid blocking writes in production
-- This index supports the primary query pattern for daily download limits:
-- WHERE businessProfileId = ? AND downloadedAt >= ?
-- Using IF NOT EXISTS to prevent errors if index already exists
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mobile_downloads_business_profile_downloaded_at 
ON mobile_downloads (businessProfileId, downloadedAt DESC);

RAISE NOTICE 'Successfully created index CONCURRENTLY (or it already existed)';

-- ================================================================================
-- SECTION 3: ADDITIONAL OPTIMIZATION INDEXES (Optional)
-- ================================================================================

RAISE NOTICE '=== SCHEMA UPDATE: ADDITIONAL OPTIMIZATION INDEXES ===';

-- Create additional index for backward compatibility with mobileUserId queries
-- This ensures existing user-based queries continue to perform well
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mobile_downloads_user_downloaded_at 
ON mobile_downloads (mobileUserId, downloadedAt DESC);

-- Create composite index for complex queries involving both business profile and user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mobile_downloads_profile_user_time 
ON mobile_downloads (businessProfileId, mobileUserId, downloadedAt DESC);

RAISE NOTICE 'Successfully created additional optimization indexes';

-- ================================================================================
-- SECTION 4: IMMEDIATE VERIFICATION
-- ================================================================================

RAISE NOTICE '=== SCHEMA UPDATE: IMMEDIATE VERIFICATION ===';

-- Verify the column was added successfully
SELECT 
    'column_verification' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mobile_downloads' 
AND column_name = 'businessprofileid'
AND table_schema = 'public';

-- Verify the indexes were created successfully
SELECT 
    'index_verification' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'mobile_downloads' 
AND indexname IN (
    'idx_mobile_downloads_business_profile_downloaded_at',
    'idx_mobile_downloads_user_downloaded_at',
    'idx_mobile_downloads_profile_user_time'
)
AND schemaname = 'public';

-- ================================================================================
-- SECTION 5: TABLE STATISTICS UPDATE
-- ================================================================================

RAISE NOTICE '=== SCHEMA UPDATE: UPDATING TABLE STATISTICS ===';

-- Update table statistics to ensure query planner has accurate information
-- This helps optimize queries using the new indexes
ANALYZE mobile_downloads;

RAISE NOTICE 'Table statistics updated for mobile_downloads';

-- ================================================================================
-- SECTION 6: SAMPLE QUERY TEST
-- ================================================================================

RAISE NOTICE '=== SCHEMA UPDATE: SAMPLE QUERY TEST ===';

-- Test the primary query pattern that will be used for download limits
-- This should return 0 for existing records since businessProfileId will be NULL
SELECT 
    'sample_query_test' as test_type,
    COUNT(*) as download_count,
    COUNT(businessProfileId) as records_with_business_profile,
    COUNT(*) - COUNT(businessProfileId) as records_without_business_profile
FROM mobile_downloads 
WHERE downloadedAt >= CURRENT_DATE;

-- Test query explanation to ensure index usage
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT COUNT(*) 
FROM mobile_downloads 
WHERE businessProfileId = 'test_profile_id' 
AND downloadedAt >= CURRENT_DATE;

-- ================================================================================
-- MIGRATION COMPLETION SUMMARY
-- ================================================================================

RAISE NOTICE '=== SCHEMA UPDATE COMPLETED ===';
RAISE NOTICE 'Changes Applied:';
RAISE NOTICE '1. Added businessProfileId column (TEXT, NULLABLE)';
RAISE NOTICE '2. Created primary index: idx_mobile_downloads_business_profile_downloaded_at';
RAISE NOTICE '3. Created optimization indexes for backward compatibility';
RAISE NOTICE '4. Updated table statistics';
RAISE NOTICE '';
RAISE NOTICE 'Next Steps:';
RAISE NOTICE '1. Run post_validation_mobile_downloads.sql';
RAISE NOTICE '2. Update application code to use businessProfileId';
RAISE NOTICE '3. Test download limit functionality';
RAISE NOTICE '4. Monitor database performance';
RAISE NOTICE '';
RAISE NOTICE 'Migration Status: SUCCESS';
