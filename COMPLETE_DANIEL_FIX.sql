-- Complete fix for Daniel's admin access
-- This script ensures Daniel has proper admin access

-- 1. Show current state
SELECT 'BEFORE FIX - All Daniel entries:' as status;
SELECT 
  id,
  email,
  firstName,
  lastName,
  name,
  role,
  team_name,
  clerk_id,
  created_at
FROM users 
WHERE email = 'daniel.kuhlen@telis-finanz'
ORDER BY created_at;

-- 2. Delete ALL Daniel entries
DELETE FROM users WHERE email = 'daniel.kuhlen@telis-finanz';

-- 3. Create ONE Daniel entry as admin
INSERT INTO users (
  clerk_id, 
  email, 
  firstName, 
  lastName, 
  name, 
  role, 
  team_name, 
  created_at, 
  updated_at
) VALUES (
  'daniel-admin-placeholder',  -- Will be updated on next login
  'daniel.kuhlen@telis-finanz',
  'Daniel',
  'Kuhlen',
  'Daniel Kuhlen',
  'admin',
  'GameChanger',
  NOW(),
  NOW()
);

-- 4. Show final state
SELECT 'AFTER FIX - Daniel entry:' as status;
SELECT 
  id,
  email,
  firstName,
  lastName,
  name,
  role,
  team_name,
  clerk_id,
  created_at
FROM users 
WHERE email = 'daniel.kuhlen@telis-finanz';

-- 5. Show all users
SELECT 'ALL USERS:' as status;
SELECT 
  id,
  email,
  name,
  role,
  team_name,
  clerk_id
FROM users 
ORDER BY role, name;
