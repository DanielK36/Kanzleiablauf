-- Add missing columns to daily_entries table for the 3 standard questions
-- Execute this SQL in Supabase SQL Editor

ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS help_needed TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS training_focus TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS improvement_focus TEXT DEFAULT '';

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
AND column_name IN ('help_needed', 'training_focus', 'improvement_focus')
ORDER BY column_name;