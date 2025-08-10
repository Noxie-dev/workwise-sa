-- Migration 0005: Update users table with missing fields
-- This migration adds missing fields to the users table for authentication and authorization

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN firebase_uid TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- Make password optional for Firebase users
-- Note: SQLite doesn't support modifying column constraints directly
-- So we'll handle this in the application logic

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);