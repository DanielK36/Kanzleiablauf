-- Fix roles and set Daniel as Admin & Top Leader
-- This script updates the role system and sets Daniel as admin

-- 1. Drop existing role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add new role constraint with simplified roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'top_leader', 'sub_leader', 'trainee'));

-- 3. Set Daniel as Admin & Top Leader
UPDATE users 
SET 
  role = 'admin',
  firstName = 'Daniel',
  lastName = 'Kuhlen',
  name = 'Daniel Kuhlen',
  team_name = 'GameChanger',
  updated_at = NOW()
WHERE email = 'daniel.kuhlen@telis-finanz';

-- 4. If Daniel doesn't exist, create him
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
)
SELECT 
  'admin-daniel-kuhlen',
  'daniel.kuhlen@telis-finanz',
  'Daniel',
  'Kuhlen',
  'Daniel Kuhlen',
  'admin',
  'GameChanger',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'daniel.kuhlen@telis-finanz'
);

-- 5. Verify the result
SELECT 
  id, 
  email, 
  firstName, 
  lastName, 
  name, 
  role, 
  team_name, 
  created_at,
  updated_at
FROM users 
WHERE email = 'daniel.kuhlen@telis-finanz';

-- 6. Show all users and their roles
SELECT 
  id,
  email,
  name,
  role,
  team_name
FROM users 
ORDER BY role, name;
