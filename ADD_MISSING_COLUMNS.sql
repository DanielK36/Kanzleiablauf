-- Add missing columns to daily_entries table
-- Run this in your Supabase SQL editor

-- Add missing columns that the API expects
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS weekday_answer TEXT,
ADD COLUMN IF NOT EXISTS help_needed TEXT,
ADD COLUMN IF NOT EXISTS training_focus TEXT,
ADD COLUMN IF NOT EXISTS improvement_today TEXT,
ADD COLUMN IF NOT EXISTS today_goals JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS today_todos JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS todos_completed JSONB DEFAULT '[false, false, false, false, false]',
ADD COLUMN IF NOT EXISTS highlight_yesterday TEXT,
ADD COLUMN IF NOT EXISTS appointments_next_week INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_improvement TEXT,
ADD COLUMN IF NOT EXISTS charisma_training BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tgs_registrations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bav_checks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiv_invitations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS taa_invitations INTEGER DEFAULT 0;

-- Update existing columns to match API expectations
-- (These might already exist with different names)
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS recommendations INTEGER DEFAULT 0;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date_entry ON daily_entries(user_id, entry_date);

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
ORDER BY ordinal_position;
