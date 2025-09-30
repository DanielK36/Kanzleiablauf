-- LINK REAL CLERK ID TO ADMIN ACCOUNT
-- This script links your real clerk_id to the admin account

-- 1. Show current state
SELECT 'CURRENT STATE - All users:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users ORDER BY role, name;

-- 2. Update Daniel admin entry with your real clerk_id
UPDATE users 
SET 
  clerk_id = 'user_323Fmf0gM8mLKTuHGu1rSjDy6gm',
  updated_at = NOW()
WHERE email = 'daniel.kuhlen@telis-finanz' 
  AND role = 'admin';

-- 3. Verify the result
SELECT 'FINAL STATE - Daniel Admin User:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users WHERE email = 'daniel.kuhlen@telis-finanz';

-- 4. Show all users
SELECT 'FINAL STATE - All users:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users ORDER BY role, name;
