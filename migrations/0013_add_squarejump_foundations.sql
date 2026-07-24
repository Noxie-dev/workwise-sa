-- SquareJUMP production foundations.
-- Existing integer primary/foreign keys are intentionally preserved.

ALTER TABLE jobs ADD COLUMN juid TEXT;
ALTER TABLE jobs ADD COLUMN public_job_ref TEXT;
ALTER TABLE jobs ADD COLUMN country_code TEXT NOT NULL DEFAULT 'ZA';
ALTER TABLE jobs ADD COLUMN province_code TEXT;
ALTER TABLE jobs ADD COLUMN municipality_code TEXT;
ALTER TABLE jobs ADD COLUMN location_code TEXT;
ALTER TABLE jobs ADD COLUMN primary_category_code TEXT;
ALTER TABLE jobs ADD COLUMN risk_status TEXT NOT NULL DEFAULT 'clear';
ALTER TABLE jobs ADD COLUMN application_link_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE jobs ADD COLUMN verified_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN subscriber_release_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN member_release_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN public_release_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN expires_at TIMESTAMP;
ALTER TABLE jobs ADD COLUMN release_policy_version TEXT;

UPDATE jobs
SET
  juid = 'juid_sq_legacy_' || id,
  public_job_ref = 'TS-JB-ZA-LEGACY-' || id
WHERE juid IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_juid_unique ON jobs(juid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_public_job_ref_unique ON jobs(public_job_ref);
-- POSTGRES_ONLY: ALTER TABLE jobs ALTER COLUMN juid SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status_public_release ON jobs(status, public_release_at);
CREATE INDEX IF NOT EXISTS idx_jobs_status_subscriber_release ON jobs(status, subscriber_release_at);

ALTER TABLE companies ADD COLUMN organisation_uid TEXT;
ALTER TABLE companies ADD COLUMN organisation_type TEXT NOT NULL DEFAULT 'employer';
ALTER TABLE companies ADD COLUMN verified_domain TEXT;
ALTER TABLE companies ADD COLUMN career_domain TEXT;
ALTER TABLE companies ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE companies ADD COLUMN registration_reference TEXT;
ALTER TABLE companies ADD COLUMN trust_status TEXT NOT NULL DEFAULT 'unknown';

UPDATE companies
SET organisation_uid = 'org_sq_legacy_' || id
WHERE organisation_uid IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_organisation_uid_unique
  ON companies(organisation_uid);
-- POSTGRES_ONLY: ALTER TABLE companies ALTER COLUMN organisation_uid SET NOT NULL;

CREATE TABLE IF NOT EXISTS job_source_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  source_id TEXT NOT NULL,
  external_job_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  apply_url TEXT,
  source_published_at TIMESTAMP,
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_payload_hash TEXT,
  normalised_payload_hash TEXT NOT NULL,
  exact_fingerprint TEXT NOT NULL,
  content_fingerprint TEXT NOT NULL,
  source_reference TEXT,
  ingest_status TEXT NOT NULL DEFAULT 'accepted',
  duplicate_confidence INTEGER NOT NULL DEFAULT 0,
  metadata JSON,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_source_records_source_external
  ON job_source_records(source_id, external_job_id);
CREATE INDEX IF NOT EXISTS idx_job_source_records_exact_fingerprint
  ON job_source_records(exact_fingerprint);
CREATE INDEX IF NOT EXISTS idx_job_source_records_content_fingerprint
  ON job_source_records(content_fingerprint);
CREATE INDEX IF NOT EXISTS idx_job_source_records_job ON job_source_records(job_id);

CREATE TABLE IF NOT EXISTS job_classifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  primary_category_code TEXT NOT NULL,
  secondary_category_codes JSON NOT NULL,
  occupation_code TEXT,
  taxonomy_version TEXT NOT NULL,
  classifier_name TEXT NOT NULL,
  classifier_version TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  classification_source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted',
  classified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_classifications_job_taxonomy
  ON job_classifications(job_id, taxonomy_version);
CREATE INDEX IF NOT EXISTS idx_job_classifications_category_job
  ON job_classifications(primary_category_code, job_id);

CREATE TABLE IF NOT EXISTS job_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  requirement_type TEXT NOT NULL,
  code TEXT,
  label TEXT NOT NULL,
  necessity TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 100,
  source TEXT NOT NULL DEFAULT 'rules',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_job_requirements_job ON job_requirements(job_id);

CREATE TABLE IF NOT EXISTS score_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_type TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  weights JSON NOT NULL,
  thresholds JSON NOT NULL,
  created_by_user_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  activated_at TIMESTAMP,
  retired_at TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_score_policies_type_version
  ON score_policies(policy_type, version);
CREATE INDEX IF NOT EXISTS idx_score_policies_active
  ON score_policies(policy_type, status);

INSERT OR IGNORE INTO score_policies (
  policy_type, version, status, weights, thresholds, approved_at, activated_at
) VALUES (
  'opportunity',
  'opportunity-v1.0',
  'active',
  '{"listingQuality":25,"employerTrust":20,"freshness":15,"engagementQuality":15,"applicationPerformance":10,"sourceReliability":10,"marketSignal":5}',
  '{"quarantinePenalty":40,"minimumReleaseScore":70}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO score_policies (
  policy_type, version, status, weights, thresholds, approved_at, activated_at
) VALUES (
  'match',
  'match-v1.0',
  'active',
  '{"category":25,"location":20,"requirements":20,"skills":10,"employmentType":10,"salary":5,"behavioural":5,"exploration":5}',
  '{"mandatoryRequirementCap":25,"minimumNotificationScore":75}',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  score_type TEXT NOT NULL,
  score_value INTEGER NOT NULL,
  component_scores JSON NOT NULL,
  penalties JSON NOT NULL,
  policy_version TEXT NOT NULL,
  feature_snapshot JSON NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_job_scores_job_type
  ON job_scores(job_id, score_type);
CREATE INDEX IF NOT EXISTS idx_job_scores_rank
  ON job_scores(score_type, score_value, calculated_at);

CREATE TABLE IF NOT EXISTS job_score_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  score_type TEXT NOT NULL,
  score_value INTEGER NOT NULL,
  component_scores JSON NOT NULL,
  penalties JSON NOT NULL,
  policy_version TEXT NOT NULL,
  feature_snapshot JSON NOT NULL,
  calculation_reason TEXT NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_job_score_history_job_time
  ON job_score_history(job_id, calculated_at);

CREATE TABLE IF NOT EXISTS user_match_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  preferred_category_codes JSON NOT NULL,
  preferred_occupation_codes JSON NOT NULL,
  preferred_location_codes JSON NOT NULL,
  travel_radius_km INTEGER NOT NULL DEFAULT 50,
  work_modes JSON NOT NULL,
  employment_types JSON NOT NULL,
  minimum_salary_cents INTEGER,
  skills JSON NOT NULL,
  qualifications JSON NOT NULL,
  licences JSON NOT NULL,
  certifications JSON NOT NULL,
  behavioural_personalisation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_job_matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  match_score INTEGER NOT NULL,
  placement_score INTEGER NOT NULL,
  component_scores JSON NOT NULL,
  reasons JSON NOT NULL,
  missing_requirements JSON NOT NULL,
  policy_version TEXT NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_job_matches_user_job
  ON user_job_matches(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_user_job_matches_user_placement
  ON user_job_matches(user_id, placement_score);

CREATE TABLE IF NOT EXISTS job_release_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  audience TEXT NOT NULL,
  release_at TIMESTAMP NOT NULL,
  policy_version TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMP,
  locked_at TIMESTAMP,
  last_error TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_job_release_events_due
  ON job_release_events(status, release_at);

CREATE TABLE IF NOT EXISTS notification_consents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  consent_status TEXT NOT NULL,
  notification_mode TEXT NOT NULL DEFAULT 'in-app-only',
  consented_at TIMESTAMP,
  consent_source TEXT,
  policy_version TEXT NOT NULL,
  withdrawn_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_consents_user_channel
  ON notification_consents(user_id, channel);

CREATE TABLE IF NOT EXISTS recommendation_exposures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  job_id INTEGER NOT NULL,
  tracking_token TEXT NOT NULL UNIQUE,
  surface TEXT NOT NULL,
  position INTEGER NOT NULL,
  release_stage TEXT NOT NULL,
  experiment_key TEXT,
  exposed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_exposures_job_time
  ON recommendation_exposures(job_id, exposed_at);

CREATE TABLE IF NOT EXISTS job_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  job_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  tracking_token TEXT NOT NULL,
  event_key TEXT NOT NULL UNIQUE,
  duration_seconds INTEGER,
  metadata JSON NOT NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_job_events_job_type_time
  ON job_events(job_id, event_type, occurred_at);

CREATE TABLE IF NOT EXISTS job_duplicate_candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL,
  candidate_job_id INTEGER,
  candidate_source_record_id INTEGER,
  confidence INTEGER NOT NULL,
  evidence JSON NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by_user_id INTEGER,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (candidate_job_id) REFERENCES jobs(id),
  FOREIGN KEY (candidate_source_record_id) REFERENCES job_source_records(id),
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_job_duplicate_candidates_pending
  ON job_duplicate_candidates(status, confidence);

CREATE TABLE IF NOT EXISTS squarejump_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_state JSON,
  after_state JSON,
  metadata JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_squarejump_audit_entity_time
  ON squarejump_audit_log(entity_type, entity_id, created_at);
