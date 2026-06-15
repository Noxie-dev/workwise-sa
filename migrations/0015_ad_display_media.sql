ALTER TABLE ad_campaigns
  ADD COLUMN IF NOT EXISTS creative_type text NOT NULL DEFAULT 'display',
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS embed_url text;
