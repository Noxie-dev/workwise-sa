CREATE TABLE IF NOT EXISTS job_ingest_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  source_site TEXT NOT NULL,
  source_url TEXT NOT NULL,
  external_id TEXT NOT NULL,
  apply_url TEXT,
  posted_at TIMESTAMP,
  fingerprint TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS job_ingest_records_source_external_idx
  ON job_ingest_records (source_site, external_id);

CREATE UNIQUE INDEX IF NOT EXISTS job_ingest_records_fingerprint_idx
  ON job_ingest_records (fingerprint);

CREATE INDEX IF NOT EXISTS job_ingest_records_job_id_idx
  ON job_ingest_records (job_id);
