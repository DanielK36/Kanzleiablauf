-- Add weekday_answers column to daily_entries table
-- Execute this SQL in Supabase SQL Editor

ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS weekday_answers JSONB DEFAULT '{}';

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
AND column_name = 'weekday_answers';