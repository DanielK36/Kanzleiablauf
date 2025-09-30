-- SIMPLE ADMIN FIX - Just update existing Daniel entry
-- This script updates the existing Daniel entry to admin role

-- 1. Show current state
SELECT 'CURRENT STATE - All users:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users ORDER BY role, name;

-- 2. Update Daniel to admin (if he exists)
UPDATE users 
SET 
  role = 'admin',
  firstName = 'Daniel',
  lastName = 'Kuhlen',
  name = 'Daniel Kuhlen',
  team_name = 'GameChanger',
  updated_at = NOW()
WHERE email = 'daniel.kuhlen@telis-finanz';

-- 3. If Daniel doesn't exist, create him with a temporary clerk_id
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
)
SELECT 
  'temp-daniel-' || extract(epoch from now()),
  'daniel.kuhlen@telis-finanz',
  'Daniel',
  'Kuhlen',
  'Daniel Kuhlen',
  'admin',
  (SELECT id FROM teams WHERE name = 'GameChanger'),
  'GameChanger',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'daniel.kuhlen@telis-finanz'
);

-- 4. Verify the result
SELECT 'FINAL STATE - Daniel Admin User:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users WHERE email = 'daniel.kuhlen@telis-finanz';

-- 5. Show all users
SELECT 'FINAL STATE - All users:' as status;
SELECT id, email, firstName, lastName, name, role, team_name, clerk_id FROM users ORDER BY role, name;
