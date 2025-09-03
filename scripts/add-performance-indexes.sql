-- Performance Indexes for Job Ingestion Pipeline
-- This script adds indexes to optimize the upsert operations and queries

-- 1. Index on externalId for efficient upsert operations
-- This is critical for the .onConflictDoUpdate() functionality
CREATE INDEX IF NOT EXISTS idx_jobs_external_id ON jobs(external_id);

-- 2. Composite index for source + ingestedAt for filtering by source and date
CREATE INDEX IF NOT EXISTS idx_jobs_source_ingested ON jobs(source, ingested_at);

-- 3. Index on companyId for efficient joins with companies table
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);

-- 4. Index on categoryId for efficient joins with categories table
CREATE INDEX IF NOT EXISTS idx_jobs_category_id ON jobs(category_id);

-- 5. Composite index for location-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_location_work_mode ON jobs(location, work_mode);

-- 6. Index on isFeatured for quick filtering of featured jobs
CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs(is_featured);

-- 7. Index on createdAt for time-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- 8. Partial index for active jobs (non-deleted, recent)
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(created_at, is_featured) 
WHERE created_at > NOW() - INTERVAL '90 days';

-- 9. Index for salary range queries (if salary is stored as numeric)
-- Note: This assumes salary might be converted to numeric in the future
-- CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON jobs(CAST(salary AS NUMERIC));

-- 10. Index for job type and work mode combinations
CREATE INDEX IF NOT EXISTS idx_jobs_type_mode ON jobs(job_type, work_mode);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'jobs' 
ORDER BY indexname;

-- Show index usage statistics (will be empty initially)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'jobs'
ORDER BY idx_scan DESC;
