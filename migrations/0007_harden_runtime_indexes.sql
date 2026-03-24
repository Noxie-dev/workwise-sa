-- Runtime hardening indexes and uniqueness guarantees

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_applications_user_job_unique
  ON job_applications (user_id, job_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_status
  ON job_applications (job_id, status);

CREATE INDEX IF NOT EXISTS idx_jobs_created_at
  ON jobs (created_at);

CREATE INDEX IF NOT EXISTS idx_user_interactions_job_time
  ON user_interactions (job_id, interaction_time);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read_created
  ON user_notifications (user_id, is_read, created_at);
