-- Migration 0014: Ad campaign management
-- Stores advertiser creatives, destination URLs, flight dates, budgets, and basic delivery metrics.

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id SERIAL PRIMARY KEY,
  advertiser_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  placement TEXT NOT NULL,
  image_url TEXT,
  target_url TEXT NOT NULL,
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  budget_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  status TEXT NOT NULL DEFAULT 'draft',
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_placement_status
  ON ad_campaigns(placement, status);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_flight
  ON ad_campaigns(start_at, end_at);
