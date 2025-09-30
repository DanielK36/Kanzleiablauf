-- Fix Marcel's team_name from GameChanger to Visionäre
UPDATE users 
SET team_name = 'Visionäre' 
WHERE id = 'a354807b-38c8-4a41-acbe-f93fcee40852' 
  AND name = 'Marcel Jansen';

-- Verify the change
SELECT 
  id,
  name,
  email,
  role,
  clerk_id,
  is_team_leader,
  team_name,
  parent_leader_id
FROM users 
WHERE id = 'a354807b-38c8-4a41-acbe-f93fcee40852';
