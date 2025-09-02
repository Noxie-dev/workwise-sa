-- Create missing tables for SQLite

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
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

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  job_count INTEGER DEFAULT 0
);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo TEXT,
  location TEXT,
  slug TEXT NOT NULL UNIQUE,
  open_positions INTEGER DEFAULT 0
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  salary TEXT,
  job_type TEXT NOT NULL,
  work_mode TEXT NOT NULL,
  company_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  is_featured INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_time DATETIME,
  duration INTEGER,
  device TEXT,
  ip_address TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create user_interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  interaction_type TEXT NOT NULL,
  interaction_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  job_id INTEGER,
  video_id TEXT,
  category_id INTEGER,
  duration INTEGER,
  metadata TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  job_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resume_url TEXT,
  cover_letter TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  job_id INTEGER,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- Create user_job_preferences table
CREATE TABLE IF NOT EXISTS user_job_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  preferred_categories TEXT,
  preferred_locations TEXT,
  preferred_job_types TEXT,
  willing_to_relocate INTEGER DEFAULT 0,
  min_salary INTEGER,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category_id ON jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_preferences_user_id ON user_job_preferences(user_id);
