-- Complete the employer posting contract without changing existing jobs.
ALTER TABLE companies ADD COLUMN bio TEXT;

ALTER TABLE jobs ADD COLUMN application_deadline TIMESTAMP;
ALTER TABLE jobs ADD COLUMN contact_name TEXT;
ALTER TABLE jobs ADD COLUMN contact_email TEXT;
ALTER TABLE jobs ADD COLUMN contact_phone TEXT;
ALTER TABLE jobs ADD COLUMN website TEXT;
ALTER TABLE jobs ADD COLUMN how_to_apply TEXT NOT NULL DEFAULT 'email';
ALTER TABLE jobs ADD COLUMN application_email TEXT;
ALTER TABLE jobs ADD COLUMN application_url TEXT;
ALTER TABLE jobs ADD COLUMN custom_instructions TEXT;
ALTER TABLE jobs ADD COLUMN is_confidential BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN screener_questions JSON NOT NULL DEFAULT '[]';
