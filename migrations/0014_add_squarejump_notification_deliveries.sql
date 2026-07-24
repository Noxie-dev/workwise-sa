-- Durable, idempotent notification delivery records for SquareJUMP releases.

CREATE TABLE IF NOT EXISTS squarejump_notification_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  release_stage TEXT NOT NULL,
  reason TEXT NOT NULL,
  dedupe_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  queued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_squarejump_notification_deliveries_user_job
  ON squarejump_notification_deliveries(user_id, job_id, channel);
CREATE INDEX IF NOT EXISTS idx_squarejump_notification_deliveries_status
  ON squarejump_notification_deliveries(status, queued_at);
