-- Add missing columns to daily_entries table
ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS help_needed TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS training_focus TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS improvement_focus TEXT DEFAULT '';
