-- Candidate saved jobs persistence

CREATE TABLE IF NOT EXISTS user_favorite_jobs (
  user_id INTEGER NOT NULL REFERENCES users(id),
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_jobs_user_created
  ON user_favorite_jobs (user_id, created_at);
