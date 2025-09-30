-- Remove obsolete columns from users table
-- These columns are no longer used and can be safely removed

-- Remove team_leader_for (obsolete)
ALTER TABLE users DROP COLUMN IF EXISTS team_leader_for;

-- Remove personal_targets jsonb (migrated to separate tables)
-- Note: This contains important data, so we'll keep it for now
-- ALTER TABLE users DROP COLUMN IF EXISTS personal_targets;

-- Remove monthly_targets jsonb (migrated to separate tables)  
-- Note: This contains important data, so we'll keep it for now
-- ALTER TABLE users DROP COLUMN IF EXISTS monthly_targets;

-- Remove obsolete columns from daily_entries table
-- These were already identified as unused

-- Remove help_request (100% NULL)
ALTER TABLE daily_entries DROP COLUMN IF EXISTS help_request;

-- Remove weekday_answer (replaced by weekday_answers)
ALTER TABLE daily_entries DROP COLUMN IF EXISTS weekday_answer;

-- Remove generic target columns (not used for leadership goals)
ALTER TABLE daily_entries DROP COLUMN IF EXISTS fa_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS eh_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS new_appointments_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS recommendations_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS tiv_invitations_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS bav_checks_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS taa_invitations_target;
ALTER TABLE daily_entries DROP COLUMN IF EXISTS tgs_registrations_target;

-- Verify the cleanup
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'daily_entries')
ORDER BY table_name, ordinal_position;
