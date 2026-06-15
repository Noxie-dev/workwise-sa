-- WiseUp V1: richer media metadata, engagement events, and comments.

ALTER TABLE wiseup_content ADD COLUMN slug TEXT;
ALTER TABLE wiseup_content ADD COLUMN source_type TEXT DEFAULT 'mp4';
ALTER TABLE wiseup_content ADD COLUMN poster TEXT;
ALTER TABLE wiseup_content ADD COLUMN thumbnail TEXT;
ALTER TABLE wiseup_content ADD COLUMN duration_sec INTEGER DEFAULT 0;
ALTER TABLE wiseup_content ADD COLUMN aspect_ratio TEXT DEFAULT '16 / 9';
ALTER TABLE wiseup_content ADD COLUMN captions TEXT;
ALTER TABLE wiseup_content ADD COLUMN chapters TEXT;
ALTER TABLE wiseup_content ADD COLUMN transcript TEXT;
ALTER TABLE wiseup_content ADD COLUMN category TEXT DEFAULT 'career';
ALTER TABLE wiseup_content ADD COLUMN active INTEGER DEFAULT 1;
ALTER TABLE wiseup_content ADD COLUMN like_count INTEGER DEFAULT 0;
ALTER TABLE wiseup_content ADD COLUMN comment_count INTEGER DEFAULT 0;
ALTER TABLE wiseup_content ADD COLUMN bookmark_count INTEGER DEFAULT 0;

ALTER TABLE wiseup_ads ADD COLUMN slug TEXT;
ALTER TABLE wiseup_ads ADD COLUMN source_type TEXT DEFAULT 'mp4';
ALTER TABLE wiseup_ads ADD COLUMN poster TEXT;
ALTER TABLE wiseup_ads ADD COLUMN thumbnail TEXT;
ALTER TABLE wiseup_ads ADD COLUMN duration_sec INTEGER DEFAULT 0;
ALTER TABLE wiseup_ads ADD COLUMN aspect_ratio TEXT DEFAULT '16 / 9';
ALTER TABLE wiseup_ads ADD COLUMN captions TEXT;
ALTER TABLE wiseup_ads ADD COLUMN chapters TEXT;
ALTER TABLE wiseup_ads ADD COLUMN transcript TEXT;
ALTER TABLE wiseup_ads ADD COLUMN category TEXT DEFAULT 'sponsored';
ALTER TABLE wiseup_ads ADD COLUMN like_count INTEGER DEFAULT 0;
ALTER TABLE wiseup_ads ADD COLUMN comment_count INTEGER DEFAULT 0;
ALTER TABLE wiseup_ads ADD COLUMN bookmark_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS wiseup_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wiseup_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  progress INTEGER,
  current_time_sec INTEGER,
  duration_sec INTEGER,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wiseup_content_active_created
  ON wiseup_content(active, created_at);

CREATE INDEX IF NOT EXISTS idx_wiseup_content_category_created
  ON wiseup_content(category, created_at);

CREATE INDEX IF NOT EXISTS idx_wiseup_ads_active_created
  ON wiseup_ads(active, created_at);

CREATE INDEX IF NOT EXISTS idx_wiseup_ads_category_created
  ON wiseup_ads(category, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wiseup_content_slug_unique
  ON wiseup_content(slug);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wiseup_ads_slug_unique
  ON wiseup_ads(slug);

CREATE INDEX IF NOT EXISTS idx_wiseup_comments_item_created
  ON wiseup_comments(item_id, created_at);

CREATE INDEX IF NOT EXISTS idx_wiseup_events_item_event_created
  ON wiseup_events(item_id, event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_wiseup_events_session_created
  ON wiseup_events(session_id, created_at);
