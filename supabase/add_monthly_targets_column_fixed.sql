-- Add monthly_targets column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_targets JSONB DEFAULT '{}';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'monthly_targets';
