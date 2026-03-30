-- ================================================================================
-- PRODUCTION DATABASE MIGRATION SCRIPT
-- Table: mobile_downloads
-- Purpose: Add businessProfileId column for "5 downloads per day per business profile"
-- 
-- IMPORTANT: This script is designed for LIVE PRODUCTION environment
-- - Contains millions of records
-- - Must avoid blocking operations
-- - Must be backward compatible
-- ================================================================================

-- ================================================================================
-- SECTION 1: PRODUCTION SAFETY NOTICE
-- ================================================================================

-- This migration script is designed to be safe for production:
-- 1. Uses CONCURRENTLY for index creation to avoid blocking writes
-- 2. Adds nullable column to avoid breaking existing code
-- 3. Includes verification steps
-- 4. Contains rollback instructions (commented)
--
-- BEFORE RUNNING:
-- - Ensure you have a recent database backup
-- - Test this script in staging environment first
-- - Schedule during low-traffic period if possible
-- - Monitor database performance during migration

-- ================================================================================
-- SECTION 2: ADD COLUMN TO mobile_downloads
-- ================================================================================

-- Add businessProfileId column as nullable TEXT for backward compatibility
-- Using IF NOT EXISTS to prevent errors if column already exists
-- This operation is safe and fast in PostgreSQL (doesn't rewrite the table)
ALTER TABLE mobile_downloads 
ADD COLUMN IF NOT EXISTS businessProfileId TEXT;

RAISE NOTICE 'Successfully added businessProfileId column to mobile_downloads table (or it already existed)';

-- ================================================================================
-- SECTION 3: CREATE INDEX CONCURRENTLY
-- ================================================================================

-- Create index CONCURRENTLY to avoid blocking writes in production
-- This index supports the primary query pattern for daily download limits:
-- WHERE businessProfileId = ? AND downloadedAt >= ?
-- Using IF NOT EXISTS to prevent errors if index already exists
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mobile_downloads_business_profile_downloaded_at 
ON mobile_downloads (businessProfileId, downloadedAt DESC);

RAISE NOTICE 'Successfully created index CONCURRENTLY (or it already existed)';

-- ================================================================================
-- SECTION 4: VERIFICATION QUERIES
-- ================================================================================

-- Verify column exists and check its properties
RAISE NOTICE '=== VERIFICATION: Column Properties ===';
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mobile_downloads' 
AND column_name = 'businessprofileid'
AND table_schema = 'public';

-- Verify index exists and check its properties
RAISE NOTICE '=== VERIFICATION: Index Properties ===';
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'mobile_downloads' 
AND indexname = 'idx_mobile_downloads_business_profile_downloaded_at'
AND schemaname = 'public';

-- Check table statistics after migration
RAISE NOTICE '=== VERIFICATION: Table Statistics ===';
SELECT 
    schemaname,
    tablename,
    tableowner,
    tablespace,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'mobile_downloads' 
AND schemaname = 'public';

-- Sample query to test new column and index
RAISE NOTICE '=== VERIFICATION: Sample Query Test ===';
-- This query demonstrates the pattern that will be used for download limit checking
-- It should return 0 for existing records since businessProfileId will be NULL
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) as download_count
FROM mobile_downloads 
WHERE businessProfileId IS NOT NULL 
AND downloadedAt >= CURRENT_DATE;

-- Check current data distribution (should show NULL for existing records)
RAISE NOTICE '=== VERIFICATION: Data Distribution ===';
SELECT 
    COUNT(*) as total_records,
    COUNT(businessProfileId) as records_with_business_profile_id,
    COUNT(*) - COUNT(businessProfileId) as records_with_null_business_profile_id
FROM mobile_downloads;

-- Test the daily download limit query pattern
RAISE NOTICE '=== VERIFICATION: Daily Download Limit Query Test ===';
SELECT 
    COUNT(*) as daily_downloads,
    COUNT(CASE WHEN businessProfileId IS NOT NULL THEN 1 END) as profile_downloads_today
FROM mobile_downloads 
WHERE downloadedAt >= CURRENT_DATE;

-- ================================================================================
-- SECTION 5: ROLLBACK INSTRUCTIONS (COMMENTED ONLY)
-- ================================================================================

/*
-- ROLLBACK INSTRUCTIONS - USE ONLY IF NECESSARY
-- ================================================================================
-- WARNING: These rollback operations should only be used if the migration 
-- causes issues. Test rollback in staging first!
-- ================================================================================

-- Step 1: Drop the created index (if it exists)
DROP INDEX CONCURRENTLY IF EXISTS idx_mobile_downloads_business_profile_downloaded_at;

-- Step 2: Remove the added column (if it exists)
-- WARNING: This will make the table unavailable for writes briefly
ALTER TABLE mobile_downloads DROP COLUMN IF EXISTS businessProfileId;

-- Step 3: Verify rollback
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'mobile_downloads' 
AND column_name = 'businessprofileid';

-- ================================================================================
-- ALTERNATIVE ROLLBACK: Create backup table before migration
-- ================================================================================

-- If you want to be extra safe, consider this approach before migration:
-- CREATE TABLE mobile_downloads_backup AS SELECT * FROM mobile_downloads;
-- Then run the migration, and if needed: 
-- DROP TABLE mobile_downloads;
-- ALTER TABLE mobile_downloads_backup RENAME TO mobile_downloads;
-- ================================================================================
*/

-- ================================================================================
-- MIGRATION COMPLETED
-- ================================================================================

RAISE NOTICE '=== MIGRATION SUMMARY ===';
RAISE NOTICE 'Table: mobile_downloads';
RAISE NOTICE 'Column Added: businessProfileId (TEXT, NULLABLE)';
RAISE NOTICE 'Index Created: idx_mobile_downloads_business_profile_downloaded_at';
RAISE NOTICE 'Status: COMPLETED';
RAISE NOTICE '';
RAISE NOTICE 'Next Steps:';
RAISE NOTICE '1. Update application code to use businessProfileId';
RAISE NOTICE '2. Test download limit functionality';
RAISE NOTICE '3. Monitor database performance';
RAISE NOTICE '4. Consider data migration for existing records (optional)';
