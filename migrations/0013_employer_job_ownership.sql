-- Migration 0013: Employer job ownership and posting metadata
-- Adds direct job ownership for employer dashboard authorization and stores
-- employer-only posting settings that are not part of the public jobs model.

ALTER TABLE jobs ADD COLUMN owner_user_id INTEGER REFERENCES users(id);
ALTER TABLE jobs ADD COLUMN employer_posting_metadata JSON;

UPDATE jobs
SET owner_user_id = COALESCE(
  (SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1),
  (SELECT id FROM users ORDER BY id LIMIT 1)
)
WHERE owner_user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_owner_user_id ON jobs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_owner_status_created ON jobs(owner_user_id, status, created_at);
