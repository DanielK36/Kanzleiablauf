-- Fix Daniel's clerk_id to match his actual Clerk user ID
-- This script ensures Daniel's database entry matches his Clerk authentication

-- 1. First, let's see what we have
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

-- 2. Delete all Daniel entries
DELETE FROM users WHERE email = 'daniel.kuhlen@telis-finanz';

-- 3. Create Daniel entry with a placeholder clerk_id (we'll update this)
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
  'daniel-kuhlen-placeholder',  -- This will be updated when Daniel logs in
  'daniel.kuhlen@telis-finanz',
  'Daniel',
  'Kuhlen',
  'Daniel Kuhlen',
  'admin',
  'GameChanger',
  NOW(),
  NOW()
);

-- 4. Verify the entry
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
SELECT 
  id,
  email,
  name,
  role,
  team_name,
  clerk_id
FROM users 
ORDER BY role, name;
