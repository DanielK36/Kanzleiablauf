-- Check current user roles and admin status
-- This script shows all users and their roles to debug admin access

-- 1. Show all users with their roles and clerk_ids
SELECT 
  'ALL USERS' as status,
  id,
  email,
  firstName,
  lastName,
  name,
  role,
  team_name,
  clerk_id,
  created_at,
  updated_at
FROM users 
ORDER BY role, name;

-- 2. Check specifically for admin users
SELECT 
  'ADMIN USERS' as status,
  id,
  email,
  name,
  role,
  clerk_id
FROM users 
WHERE role = 'admin';

-- 3. Check for Daniel specifically
SELECT 
  'DANIEL USER' as status,
  id,
  email,
  name,
  role,
  clerk_id,
  team_name
FROM users 
WHERE email = 'daniel.kuhlen@telis-finanz' OR name ILIKE '%daniel%';

-- 4. Check role constraints
SELECT 
  'ROLE CONSTRAINTS' as status,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass 
  AND conname LIKE '%role%';
