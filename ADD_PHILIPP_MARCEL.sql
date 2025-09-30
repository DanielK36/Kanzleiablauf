-- Philipp und Marcel in users Tabelle hinzufügen
-- Führe das in der Supabase SQL Console aus

-- 1. Philipp Clingen hinzufügen (Team Leader von Visionäre)
INSERT INTO users (
  clerk_id,
  email,
  firstname,
  lastname,
  name,
  role,
  team_name,
  personal_targets,
  monthly_targets,
  consent_given,
  consent_date,
  created_at,
  updated_at,
  team_id,
  is_team_leader,
  is_authorized_leader
) VALUES (
  'user_335biHQpHKEzRSLzPLJ5ZEJ1MwX',
  'philipp.clingen@telis-finanz.de',
  'Philipp',
  'Clingen',
  'Philipp Clingen',
  'führungskraft',
  'Visionäre',
  '{"fa_daily": 0, "eh_daily": 0, "new_appointments_daily": 0, "recommendations_daily": 0, "tiv_invitations_daily": 0, "taa_invitations_daily": 0, "tgs_registrations_daily": 0, "bav_checks_daily": 0}',
  '{"fa_target": 0, "eh_target": 0, "new_appointments_target": 0, "recommendations_target": 0, "tiv_invitations_target": 0, "taa_invitations_target": 0, "tgs_registrations_target": 0, "bav_checks_target": 0}',
  true,
  NOW(),
  NOW(),
  NOW(),
  2,  -- Team ID für Visionäre (angenommen)
  true,
  true
);

-- 2. Marcel Jansen hinzufügen (Berater im Team Visionäre)
INSERT INTO users (
  clerk_id,
  email,
  firstname,
  lastname,
  name,
  role,
  team_name,
  personal_targets,
  monthly_targets,
  consent_given,
  consent_date,
  created_at,
  updated_at,
  team_id,
  is_team_leader,
  is_authorized_leader
) VALUES (
  'user_335kHjSPJxIxmDxWgyuv70kPIPr',
  'jansen.marcel@telis-finanz.de',
  'Marcel',
  'Jansen',
  'Marcel Jansen',
  'berater',
  'Visionäre',
  '{"fa_daily": 0, "eh_daily": 0, "new_appointments_daily": 0, "recommendations_daily": 0, "tiv_invitations_daily": 0, "taa_invitations_daily": 0, "tgs_registrations_daily": 0, "bav_checks_daily": 0}',
  '{"fa_target": 0, "eh_target": 0, "new_appointments_target": 0, "recommendations_target": 0, "tiv_invitations_target": 0, "taa_invitations_target": 0, "tgs_registrations_target": 0, "bav_checks_target": 0}',
  true,
  NOW(),
  NOW(),
  NOW(),
  2,  -- Team ID für Visionäre (angenommen)
  false,
  false
);

-- 3. Überprüfung: Zeige alle User
SELECT 
  id,
  clerk_id,
  email,
  firstname,
  lastname,
  name,
  role,
  team_name,
  created_at
FROM users 
ORDER BY created_at DESC;
