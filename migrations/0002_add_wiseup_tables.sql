-- Create WiseUp content table
CREATE TABLE IF NOT EXISTS wiseup_content (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  creator JSONB NOT NULL,
  video TEXT NOT NULL,
  description TEXT NOT NULL,
  resources JSONB,
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create WiseUp ads table
CREATE TABLE IF NOT EXISTS wiseup_ads (
  id SERIAL PRIMARY KEY,
  advertiser TEXT NOT NULL,
  title TEXT NOT NULL,
  video TEXT NOT NULL,
  cta TEXT NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  target_interests JSONB,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create WiseUp bookmarks table
CREATE TABLE IF NOT EXISTS wiseup_bookmarks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  wiseup_item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  bookmarked_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create WiseUp ad impressions table
CREATE TABLE IF NOT EXISTS wiseup_ad_impressions (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  platform TEXT DEFAULT 'web'
);

-- Create WiseUp user progress table
CREATE TABLE IF NOT EXISTS wiseup_user_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  last_watched TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_wiseup_content_tags ON wiseup_content USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_wiseup_ads_target_interests ON wiseup_ads USING GIN (target_interests);
CREATE INDEX IF NOT EXISTS idx_wiseup_bookmarks_user_id ON wiseup_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_wiseup_bookmarks_item_type ON wiseup_bookmarks(item_type);
CREATE INDEX IF NOT EXISTS idx_wiseup_ad_impressions_ad_id ON wiseup_ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_wiseup_user_progress_user_id ON wiseup_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_wiseup_user_progress_content_id ON wiseup_user_progress(content_id);

-- Create unique constraint to prevent duplicate bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS idx_wiseup_bookmarks_unique 
ON wiseup_bookmarks(user_id, wiseup_item_id, item_type);

-- Create unique constraint to prevent duplicate progress entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_wiseup_user_progress_unique 
ON wiseup_user_progress(user_id, content_id);
