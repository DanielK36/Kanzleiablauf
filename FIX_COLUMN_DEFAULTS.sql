-- Fix default values for the new columns
-- Execute this SQL in Supabase SQL Editor

ALTER TABLE daily_entries 
ALTER COLUMN help_needed SET DEFAULT '',
ALTER COLUMN training_focus SET DEFAULT '';

-- Update existing NULL values to empty strings
UPDATE daily_entries 
SET help_needed = '' 
WHERE help_needed IS NULL;

UPDATE daily_entries 
SET training_focus = '' 
WHERE training_focus IS NULL;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
AND column_name IN ('help_needed', 'training_focus', 'improvement_focus')
ORDER BY column_name;
