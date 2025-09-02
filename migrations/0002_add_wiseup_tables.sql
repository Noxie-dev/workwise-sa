-- Create WiseUp content table
CREATE TABLE IF NOT EXISTS wiseup_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  creator TEXT NOT NULL,
  video TEXT NOT NULL,
  description TEXT NOT NULL,
  resources TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create WiseUp ads table
CREATE TABLE IF NOT EXISTS wiseup_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  advertiser TEXT NOT NULL,
  title TEXT NOT NULL,
  video TEXT NOT NULL,
  cta TEXT NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  target_interests TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create WiseUp bookmarks table
CREATE TABLE IF NOT EXISTS wiseup_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  wiseup_item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  bookmarked_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create WiseUp ad impressions table
CREATE TABLE IF NOT EXISTS wiseup_ad_impressions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  platform TEXT DEFAULT 'web'
);

-- Create WiseUp user progress table
CREATE TABLE IF NOT EXISTS wiseup_user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  content_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  last_watched DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
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
