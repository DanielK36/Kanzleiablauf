-- Luca Kempen als Team-Leader für "Proud" autorisieren

UPDATE users
SET 
  is_team_leader = true,
  is_authorized_leader = true,
  updated_at = NOW()
WHERE clerk_id = 'user_33SF56G9HrYMOgUJO6FW5j9fvj4';

-- Verifizieren
SELECT 
  name,
  team_name,
  role,
  is_team_leader,
  is_authorized_leader,
  parent_leader_id
FROM users
WHERE clerk_id = 'user_33SF56G9HrYMOgUJO6FW5j9fvj4';

