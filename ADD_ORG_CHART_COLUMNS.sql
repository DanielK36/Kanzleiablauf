-- ADD ORGANIZATIONAL CHART COLUMNS
-- This script adds the necessary columns for the organizational chart functionality

-- Add columns to users table for leader authorization
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_authorized_leader BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS can_create_subteams BOOLEAN DEFAULT FALSE;

-- Update existing top_leader users to be authorized leaders
UPDATE users 
SET 
  is_authorized_leader = TRUE,
  can_create_subteams = TRUE
WHERE role = 'top_leader';

-- Verify the changes
SELECT 'FINAL STATE - Users with authorization:' as status;
SELECT id, firstname, lastname, name, role, team_name, is_authorized_leader, can_create_subteams 
FROM users 
WHERE role IN ('admin', 'top_leader', 'sub_leader') 
ORDER BY role, name;
