-- FINAL ADMIN FIX - Complete solution for admin access
-- This script fixes the clerk_id mismatch and ensures admin access works

-- 1. Show current state
SELECT 'CURRENT STATE - All users:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users ORDER BY role, name;

-- 2. Delete all Daniel entries
DELETE FROM users WHERE email = 'daniel.kuhlen@telis-finanz';

-- 3. Create Daniel entry with a temporary clerk_id (will be updated on login)
INSERT INTO users (
  clerk_id,
  email, 
  firstName, 
  lastName, 
  name, 
  role, 
  team_id,
  team_name, 
  created_at, 
  updated_at
) VALUES (
  'temp-daniel-admin-' || extract(epoch from now()),
  'daniel.kuhlen@telis-finanz',
  'Daniel',
  'Kuhlen',
  'Daniel Kuhlen',
  'admin',
  (SELECT id FROM teams WHERE name = 'GameChanger'),
  'GameChanger',
  NOW(),
  NOW()
);

-- 4. Verify the result
SELECT 'FINAL STATE - Daniel Admin User:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users WHERE email = 'daniel.kuhlen@telis-finanz';

-- 5. Show all users
SELECT 'FINAL STATE - All users:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users ORDER BY role, name;
