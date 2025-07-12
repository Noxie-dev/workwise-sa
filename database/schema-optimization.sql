-- =====================================================================
-- WorkWise SA Database Schema Optimization
-- 
-- This file contains schema improvements including:
-- 1. Normalization recommendations
-- 2. Critical indexes for performance
-- 3. Query validation statements
-- =====================================================================

-- =====================================================================
-- SCHEMA NORMALIZATION IMPROVEMENTS
-- =====================================================================

-- Create normalized user skills table (optional - if complex skills queries are needed)
CREATE TABLE IF NOT EXISTS user_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level INTEGER DEFAULT 1 CHECK (proficiency_level BETWEEN 1 AND 5),
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, skill_name)
);

-- Create normalized user locations table (for better location matching)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL DEFAULT 'South Africa',
    province VARCHAR(100),
    coordinates POINT, -- For geographic distance calculations
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create job types lookup table (normalize job types)
CREATE TABLE IF NOT EXISTS job_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create work modes lookup table (normalize work modes)
CREATE TABLE IF NOT EXISTS work_modes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Insert standard job types
INSERT INTO job_types (name, description) VALUES 
    ('Full-time', 'Regular full-time employment'),
    ('Part-time', 'Part-time employment'),
    ('Contract', 'Contract-based employment'),
    ('Temporary', 'Temporary employment'),
    ('Internship', 'Internship position'),
    ('Freelance', 'Freelance work')
ON CONFLICT (name) DO NOTHING;

-- Insert standard work modes
INSERT INTO work_modes (name, description) VALUES 
    ('Remote', 'Work from anywhere'),
    ('On-site', 'Work from office location'),
    ('Hybrid', 'Mix of remote and on-site work')
ON CONFLICT (name) DO NOTHING;

-- =====================================================================
-- PERFORMANCE INDEXES
-- =====================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users USING btree(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users USING btree(username);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING btree(location);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users USING btree(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_users_engagement_score ON users USING btree(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users USING btree(created_at DESC);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs USING btree(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category_id ON jobs USING btree(category_id);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs USING btree(location);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs USING btree(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_work_mode ON jobs USING btree(work_mode);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs USING btree(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs USING btree(is_featured);

-- Composite indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_location_type ON jobs USING btree(location, job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_company_featured ON jobs USING btree(company_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_category_created ON jobs USING btree(category_id, created_at DESC);

-- Full-text search index for job titles and descriptions
CREATE INDEX IF NOT EXISTS idx_jobs_title_fts ON jobs USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_jobs_description_fts ON jobs USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_jobs_combined_fts ON jobs USING gin(to_tsvector('english', title || ' ' || description));

-- Companies table indexes
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies USING btree(name);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies USING btree(slug);
CREATE INDEX IF NOT EXISTS idx_companies_location ON companies USING btree(location);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories USING btree(slug);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories USING btree(name);

-- User interactions table indexes (critical for analytics)
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_job_id ON user_interactions USING btree(job_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type ON user_interactions USING btree(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_time ON user_interactions USING btree(interaction_time DESC);

-- Composite indexes for user interactions
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_job ON user_interactions USING btree(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_type ON user_interactions USING btree(user_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_interactions_type_time ON user_interactions USING btree(interaction_type, interaction_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_interactions_job_type ON user_interactions USING btree(job_id, interaction_type);

-- User sessions table indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON user_sessions USING btree(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_duration ON user_sessions USING btree(duration DESC);

-- Job applications table indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications USING btree(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications USING btree(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications USING btree(applied_at DESC);

-- Composite indexes for job applications
CREATE INDEX IF NOT EXISTS idx_job_applications_user_job ON job_applications USING btree(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_status ON job_applications USING btree(user_id, status);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_status ON job_applications USING btree(job_id, status);

-- User notifications table indexes
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications USING btree(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications USING btree(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications USING btree(created_at DESC);

-- Composite indexes for notifications
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON user_notifications USING btree(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_created ON user_notifications USING btree(user_id, created_at DESC);

-- User job preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_job_preferences_user_id ON user_job_preferences USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_preferences_updated_at ON user_job_preferences USING btree(updated_at DESC);

-- Files table indexes
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files USING btree(file_type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files USING btree(created_at DESC);

-- WiseUp content indexes
CREATE INDEX IF NOT EXISTS idx_wiseup_content_created_at ON wiseup_content USING btree(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wiseup_content_title ON wiseup_content USING btree(title);

-- WiseUp ads indexes
CREATE INDEX IF NOT EXISTS idx_wiseup_ads_active ON wiseup_ads USING btree(active);
CREATE INDEX IF NOT EXISTS idx_wiseup_ads_created_at ON wiseup_ads USING btree(created_at DESC);

-- WiseUp bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_wiseup_bookmarks_user_id ON wiseup_bookmarks USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_wiseup_bookmarks_item_type ON wiseup_bookmarks USING btree(item_type);
CREATE INDEX IF NOT EXISTS idx_wiseup_bookmarks_bookmarked_at ON wiseup_bookmarks USING btree(bookmarked_at DESC);

-- Composite indexes for WiseUp bookmarks
CREATE INDEX IF NOT EXISTS idx_wiseup_bookmarks_user_item ON wiseup_bookmarks USING btree(user_id, wiseup_item_id);

-- WiseUp ad impressions indexes
CREATE INDEX IF NOT EXISTS idx_wiseup_ad_impressions_ad_id ON wiseup_ad_impressions USING btree(ad_id);
CREATE INDEX IF NOT EXISTS idx_wiseup_ad_impressions_user_id ON wiseup_ad_impressions USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_wiseup_ad_impressions_timestamp ON wiseup_ad_impressions USING btree(timestamp DESC);

-- WiseUp user progress indexes
CREATE INDEX IF NOT EXISTS idx_wiseup_user_progress_user_id ON wiseup_user_progress USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_wiseup_user_progress_content_id ON wiseup_user_progress USING btree(content_id);
CREATE INDEX IF NOT EXISTS idx_wiseup_user_progress_completed ON wiseup_user_progress USING btree(completed);

-- Composite indexes for WiseUp user progress
CREATE INDEX IF NOT EXISTS idx_wiseup_user_progress_user_content ON wiseup_user_progress USING btree(user_id, content_id);

-- =====================================================================
-- JSONB INDEXES (for better performance on JSON queries)
-- =====================================================================

-- User skills JSONB index
CREATE INDEX IF NOT EXISTS idx_users_skills_gin ON users USING gin(skills);

-- User preferences JSONB indexes
CREATE INDEX IF NOT EXISTS idx_users_preferences_gin ON users USING gin(preferences);
CREATE INDEX IF NOT EXISTS idx_users_experience_gin ON users USING gin(experience);
CREATE INDEX IF NOT EXISTS idx_users_education_gin ON users USING gin(education);

-- User job preferences JSONB indexes
CREATE INDEX IF NOT EXISTS idx_user_job_preferences_categories_gin ON user_job_preferences USING gin(preferred_categories);
CREATE INDEX IF NOT EXISTS idx_user_job_preferences_locations_gin ON user_job_preferences USING gin(preferred_locations);
CREATE INDEX IF NOT EXISTS idx_user_job_preferences_job_types_gin ON user_job_preferences USING gin(preferred_job_types);

-- WiseUp content tags index
CREATE INDEX IF NOT EXISTS idx_wiseup_content_tags_gin ON wiseup_content USING gin(tags);

-- WiseUp ads target interests index
CREATE INDEX IF NOT EXISTS idx_wiseup_ads_target_interests_gin ON wiseup_ads USING gin(target_interests);

-- =====================================================================
-- CONSTRAINT IMPROVEMENTS
-- =====================================================================

-- Add check constraints for data integrity
ALTER TABLE users ADD CONSTRAINT chk_engagement_score_range 
    CHECK (engagement_score >= 0 AND engagement_score <= 1000);

ALTER TABLE user_interactions ADD CONSTRAINT chk_duration_positive 
    CHECK (duration IS NULL OR duration >= 0);

ALTER TABLE job_applications ADD CONSTRAINT chk_valid_status 
    CHECK (status IN ('applied', 'reviewed', 'interview', 'rejected', 'hired'));

ALTER TABLE wiseup_user_progress ADD CONSTRAINT chk_progress_range 
    CHECK (progress >= 0 AND progress <= 100);

-- =====================================================================
-- PERFORMANCE OPTIMIZATION QUERIES FOR VALIDATION
-- =====================================================================

-- Query 1: Most recent jobs by category (should use idx_jobs_category_created)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT j.*, c.name as company_name 
FROM jobs j 
JOIN companies c ON j.company_id = c.id 
WHERE j.category_id = 1 
ORDER BY j.created_at DESC 
LIMIT 10;

-- Query 2: User job recommendations based on location (should use idx_jobs_location)
EXPLAIN (ANALYZE, BUFFERS)
SELECT j.*, c.name as company_name 
FROM jobs j 
JOIN companies c ON j.company_id = c.id 
WHERE j.location = 'Cape Town' 
AND j.job_type = 'Full-time'
ORDER BY j.created_at DESC 
LIMIT 20;

-- Query 3: User interactions analysis (should use idx_user_interactions_user_type)
EXPLAIN (ANALYZE, BUFFERS)
SELECT interaction_type, COUNT(*) as count 
FROM user_interactions 
WHERE user_id = 1 
AND interaction_time >= NOW() - INTERVAL '30 days'
GROUP BY interaction_type;

-- Query 4: Job search with full-text search (should use idx_jobs_combined_fts)
EXPLAIN (ANALYZE, BUFFERS)
SELECT j.*, c.name as company_name,
       ts_rank(to_tsvector('english', j.title || ' ' || j.description), 
               plainto_tsquery('english', 'software engineer')) as rank
FROM jobs j 
JOIN companies c ON j.company_id = c.id 
WHERE to_tsvector('english', j.title || ' ' || j.description) @@ 
      plainto_tsquery('english', 'software engineer')
ORDER BY rank DESC, j.created_at DESC 
LIMIT 20;

-- Query 5: User engagement score calculation (should use multiple indexes)
EXPLAIN (ANALYZE, BUFFERS)
SELECT u.id, u.name, u.engagement_score,
       COUNT(ui.id) as total_interactions,
       COUNT(CASE WHEN ui.interaction_type = 'apply' THEN 1 END) as applications
FROM users u 
LEFT JOIN user_interactions ui ON u.id = ui.user_id 
WHERE u.last_active >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.name, u.engagement_score 
ORDER BY u.engagement_score DESC 
LIMIT 50;

-- Query 6: Job applications by user (should use idx_job_applications_user_status)
EXPLAIN (ANALYZE, BUFFERS)
SELECT ja.*, j.title, c.name as company_name 
FROM job_applications ja 
JOIN jobs j ON ja.job_id = j.id 
JOIN companies c ON j.company_id = c.id 
WHERE ja.user_id = 1 
ORDER BY ja.applied_at DESC;

-- Query 7: Popular jobs based on interactions (should use idx_user_interactions_job_type)
EXPLAIN (ANALYZE, BUFFERS)
SELECT j.id, j.title, c.name as company_name,
       COUNT(CASE WHEN ui.interaction_type = 'view' THEN 1 END) as views,
       COUNT(CASE WHEN ui.interaction_type = 'apply' THEN 1 END) as applications,
       COUNT(CASE WHEN ui.interaction_type = 'save' THEN 1 END) as saves
FROM jobs j 
JOIN companies c ON j.company_id = c.id 
LEFT JOIN user_interactions ui ON j.id = ui.job_id 
WHERE j.created_at >= NOW() - INTERVAL '30 days'
GROUP BY j.id, j.title, c.name 
HAVING COUNT(ui.id) > 0
ORDER BY COUNT(ui.id) DESC 
LIMIT 20;

-- Query 8: WiseUp content engagement (should use WiseUp indexes)
EXPLAIN (ANALYZE, BUFFERS)
SELECT wc.id, wc.title,
       COUNT(wb.id) as bookmarks,
       AVG(wup.progress) as avg_progress
FROM wiseup_content wc 
LEFT JOIN wiseup_bookmarks wb ON wc.id::text = wb.wiseup_item_id AND wb.item_type = 'content'
LEFT JOIN wiseup_user_progress wup ON wc.id = wup.content_id 
GROUP BY wc.id, wc.title 
ORDER BY COUNT(wb.id) DESC 
LIMIT 10;

-- =====================================================================
-- MAINTENANCE QUERIES
-- =====================================================================

-- Update job counts for categories
UPDATE categories 
SET job_count = (
    SELECT COUNT(*) 
    FROM jobs 
    WHERE jobs.category_id = categories.id
);

-- Update open positions for companies
UPDATE companies 
SET open_positions = (
    SELECT COUNT(*) 
    FROM jobs 
    WHERE jobs.company_id = companies.id
);

-- Clean up old user sessions (older than 6 months)
DELETE FROM user_sessions 
WHERE start_time < NOW() - INTERVAL '6 months';

-- Clean up old interactions (older than 2 years)
DELETE FROM user_interactions 
WHERE interaction_time < NOW() - INTERVAL '2 years';

-- =====================================================================
-- MONITORING QUERIES
-- =====================================================================

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries (requires pg_stat_statements extension)
-- SELECT query, calls, total_time, mean_time, rows 
-- FROM pg_stat_statements 
-- ORDER BY mean_time DESC 
-- LIMIT 10;

-- =====================================================================
-- END OF SCHEMA OPTIMIZATION
-- =====================================================================
