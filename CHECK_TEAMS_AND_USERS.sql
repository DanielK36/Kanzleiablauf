-- Check teams and users
SELECT 
  t.id as team_id,
  t.name as team_name,
  t.parent_team_id,
  t.team_level
FROM teams t
ORDER BY t.id;

SELECT 
  u.id as user_id,
  u.firstname,
  u.name,
  u.role,
  u.team_id,
  u.team_name
FROM users u
ORDER BY u.id;
