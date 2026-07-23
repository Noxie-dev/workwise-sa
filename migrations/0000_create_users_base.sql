-- PostgreSQL-safe base dependency for the migration chain.
-- 0001_add_files_table.sql references users, so the parent table must exist
-- before the first file migration runs. 0003 remains responsible for the
-- rest of the initial application tables and is idempotent for users.
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  bio TEXT,
  phone_number TEXT,
  willing_to_relocate INTEGER DEFAULT 0,
  preferences TEXT,
  experience TEXT,
  education TEXT,
  skills TEXT,
  last_active DATETIME,
  engagement_score INTEGER DEFAULT 0,
  notification_preference INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
