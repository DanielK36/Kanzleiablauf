-- SIMPLE SOLUTION: Just make Daniel admin
-- This script simply updates Daniel's existing entry to admin role

-- 1. Show current state
SELECT 'CURRENT STATE - All users:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users ORDER BY role, name;

-- 2. Update Daniel's existing entry to admin (regardless of current role)
UPDATE users 
SET 
  role = 'admin',
  firstName = 'Daniel',
  lastName = 'Kuhlen',
  name = 'Daniel Kuhlen',
  team_name = 'GameChanger',
  updated_at = NOW()
WHERE email = 'daniel.kuhlen@telis-finanz';

-- 3. Verify the result
SELECT 'FINAL STATE - Daniel Admin User:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users WHERE email = 'daniel.kuhlen@telis-finanz';

-- 4. Show all users
SELECT 'FINAL STATE - All users:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users ORDER BY role, name;
