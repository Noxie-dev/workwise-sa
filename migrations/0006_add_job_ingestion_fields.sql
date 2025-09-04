-- Migration: Add job ingestion fields
-- Date: 2025-01-XX
-- Description: Add fields for job ingestion pipeline including externalId, source, and ingestedAt

-- Add new columns to jobs table
ALTER TABLE jobs 
ADD COLUMN external_id TEXT UNIQUE,
ADD COLUMN source TEXT,
ADD COLUMN ingested_at TIMESTAMP DEFAULT NOW();

-- Create index on external_id for faster lookups during upserts
CREATE INDEX idx_jobs_external_id ON jobs(external_id);

-- Create index on source for filtering and analytics
CREATE INDEX idx_jobs_source ON jobs(source);

-- Create index on ingested_at for time-based queries
CREATE INDEX idx_jobs_ingested_at ON jobs(ingested_at);

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN jobs.external_id IS 'Unique identifier from external job sources for deduplication';
COMMENT ON COLUMN jobs.source IS 'Source of the job listing (e.g., indeed, linkedin, manual)';
COMMENT ON COLUMN jobs.ingested_at IS 'Timestamp when the job was ingested into the system';

-- Update existing jobs to have a default source
UPDATE jobs SET source = 'manual' WHERE source IS NULL;

-- Make source column NOT NULL after setting default values
ALTER TABLE jobs ALTER COLUMN source SET NOT NULL;


