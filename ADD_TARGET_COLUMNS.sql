-- Add missing daily target columns to daily_entries table
-- Execute this SQL in Supabase SQL Editor

ALTER TABLE daily_entries 
ADD COLUMN IF NOT EXISTS fa_daily_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS eh_daily_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_appointments_daily_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recommendations_daily_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiv_invitations_daily_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bav_checks_daily_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS taa_invitations_daily_target INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tgs_registrations_daily_target INTEGER DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
AND column_name LIKE '%_daily_target'
ORDER BY column_name;
