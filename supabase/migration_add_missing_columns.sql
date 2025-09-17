-- Migration: Add missing columns to daily_entries table
-- Execute this in your Supabase SQL editor

-- Add charisma_training column
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS charisma_training BOOLEAN DEFAULT false;

-- Add today_goals column
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS today_goals JSONB DEFAULT '{}';

-- Add today_todos column  
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS today_todos JSONB DEFAULT '[]';

-- Add help_needed column
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS help_needed TEXT;

-- Add training_focus column (if not already exists)
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS training_focus TEXT;

-- Add weekly_improvement column
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS weekly_improvement TEXT;

-- Add todos_completed column
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS todos_completed JSONB DEFAULT '[]';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
AND column_name IN ('charisma_training', 'today_goals', 'today_todos', 'help_needed', 'training_focus', 'weekly_improvement', 'todos_completed')
ORDER BY column_name;
