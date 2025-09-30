-- Migration: Remove obsolete columns from daily_entries table
-- Remove columns that are confirmed unused or replaced

-- Remove help_request (100% NULL)
ALTER TABLE daily_entries DROP COLUMN IF EXISTS help_request;

-- Remove weekday_answer (replaced by weekday_answers)
ALTER TABLE daily_entries DROP COLUMN IF EXISTS weekday_answer;

-- Remove generic target columns (always 0, not used for leadership goals)
-- These are WITHOUT "daily" suffix and always 0 in the dump
ALTER TABLE daily_entries DROP COLUMN IF EXISTS fa_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS eh_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS new_appointments_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS recommendations_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS tiv_invitations_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS bav_checks_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS taa_invitations_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS tgs_registrations_target;

-- Verify the changes - show remaining columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_entries' 
AND table_schema = 'public'
ORDER BY column_name;
