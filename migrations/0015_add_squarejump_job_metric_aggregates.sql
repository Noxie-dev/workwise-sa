-- Daily exposure-normalized job metrics used by Opportunity Score recalculation.

CREATE TABLE IF NOT EXISTS squarejump_job_metric_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  bucket_start TIMESTAMP NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  qualified_views INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  hides INTEGER NOT NULL DEFAULT 0,
  reports INTEGER NOT NULL DEFAULT 0,
  application_starts INTEGER NOT NULL DEFAULT 0,
  application_completions INTEGER NOT NULL DEFAULT 0,
  outbound_applications INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  UNIQUE(job_id, bucket_start)
);

CREATE INDEX IF NOT EXISTS idx_squarejump_job_metric_aggregates_job_bucket
  ON squarejump_job_metric_aggregates(job_id, bucket_start);
