-- Fix duplicate Daniel entries and ensure only one admin entry
-- This script removes duplicates and ensures Daniel is only admin

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

-- 3. Create only one Daniel entry as admin
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
  'admin-daniel-kuhlen',
  'daniel.kuhlen@telis-finanz',
  'Daniel',
  'Kuhlen',
  'Daniel Kuhlen',
  'admin',
  'GameChanger',
  NOW(),
  NOW()
);

-- 4. Verify we have only one Daniel entry
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

-- 5. Show all users to see the complete picture
SELECT 
  id,
  email,
  name,
  role,
  team_name,
  clerk_id
FROM users 
ORDER BY role, name;
