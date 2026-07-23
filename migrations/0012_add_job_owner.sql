ALTER TABLE jobs ADD COLUMN created_by_user_id INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_by_user_id ON jobs(created_by_user_id);
