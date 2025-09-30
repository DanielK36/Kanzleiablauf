-- SETUP HIERARCHY FIELDS
-- This script sets up the hierarchy fields for existing users

-- 1. Check current state
SELECT 'CURRENT STATE - Users with hierarchy fields:' as status;
SELECT id, name, email, role, team_name, parent_leader_id, is_team_leader 
FROM users 
ORDER BY role, name;

-- 2. Add hierarchy columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_leader_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT FALSE;

-- 3. Set up basic hierarchy structure
-- First, let's identify potential team leaders (users with role 'führungskraft')
SELECT 'Potential team leaders:' as status;
SELECT id, name, role, team_name 
FROM users 
WHERE role = 'führungskraft' 
ORDER BY name;

-- 4. Set up a basic hierarchy (you can modify this based on your actual structure)
-- Example: Set the first führungskraft as team leader for their team
UPDATE users 
SET is_team_leader = TRUE 
WHERE role = 'führungskraft' 
AND id IN (
  SELECT DISTINCT ON (team_name) id 
  FROM users 
  WHERE role = 'führungskraft' 
  ORDER BY team_name, created_at ASC
);

-- 5. Set parent_leader_id for berater and trainee (assign them to team leaders)
-- This is a basic setup - you should customize this based on your actual structure
UPDATE users 
SET parent_leader_id = (
  SELECT u2.id 
  FROM users u2 
  WHERE u2.team_name = users.team_name 
  AND u2.is_team_leader = TRUE 
  AND u2.role = 'führungskraft'
  LIMIT 1
)
WHERE role IN ('berater', 'trainee')
AND team_name IS NOT NULL;

-- 6. Show final hierarchy structure
SELECT 'FINAL HIERARCHY STRUCTURE:' as status;
SELECT 
  u1.name as user_name,
  u1.role as user_role,
  u1.team_name,
  u1.is_team_leader,
  u2.name as parent_name,
  u2.role as parent_role
FROM users u1
LEFT JOIN users u2 ON u1.parent_leader_id = u2.id
ORDER BY u1.team_name, u1.is_team_leader DESC, u1.role, u1.name;

-- 7. Show team leaders and their subordinates
SELECT 'TEAM LEADERS AND SUBORDINATES:' as status;
SELECT 
  tl.name as team_leader,
  tl.team_name,
  COUNT(s.id) as subordinate_count,
  STRING_AGG(s.name, ', ') as subordinates
FROM users tl
LEFT JOIN users s ON s.parent_leader_id = tl.id
WHERE tl.is_team_leader = TRUE
GROUP BY tl.id, tl.name, tl.team_name
ORDER BY tl.team_name;
