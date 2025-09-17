-- Add last_monthly_goal_update column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_monthly_goal_update TIMESTAMP WITH TIME ZONE;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'last_monthly_goal_update';
