ALTER TABLE jobs
ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at
ON jobs (status, created_at DESC);
