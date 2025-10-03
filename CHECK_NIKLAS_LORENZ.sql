-- Prüfe Niklas und Lorenz Kliver in der Datenbank

SELECT 
  id,
  name,
  team_name,
  role,
  is_team_leader,
  parent_leader_id,
  (SELECT name FROM users WHERE id = parent_leader_id) as parent_leader_name
FROM users
WHERE name LIKE '%Kliver%'
ORDER BY name;

-- Prüfe Philipp (Visionäre Team-Leader)
SELECT 
  id,
  name,
  team_name,
  is_team_leader,
  parent_leader_id
FROM users
WHERE team_name = 'Visionäre' AND is_team_leader = true;

-- Prüfe alle Visionäre Team-Mitglieder
SELECT 
  id,
  name,
  team_name,
  role,
  parent_leader_id,
  (SELECT name FROM users WHERE id = parent_leader_id) as parent_leader_name
FROM users
WHERE team_name = 'Visionäre'
ORDER BY name;

