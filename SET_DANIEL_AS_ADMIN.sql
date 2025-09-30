-- Daniel Kuhlen als Admin setzen
-- Führe das in der Supabase SQL Console aus

-- Option 1: Wenn der Benutzer bereits existiert (Email: daniel.kuhlen@telis-finanz)
UPDATE users 
SET 
  role = 'admin',
  firstName = 'Daniel',
  lastName = 'Kuhlen',
  name = 'Daniel Kuhlen',
  team_name = 'GameChanger',
  updated_at = NOW()
WHERE email = 'daniel.kuhlen@telis-finanz';

-- Option 2: Falls der Benutzer nicht existiert, erstelle ihn neu
-- (Führe das nur aus, wenn Option 1 keine Zeilen betroffen hat)
INSERT INTO users (
  clerk_id,
  email,
  firstName,
  lastName,
  name,
  role,
  team_name,
  personal_targets,
  monthly_targets,
  consent_given,
  consent_date,
  created_at,
  updated_at
) VALUES (
  'temp_clerk_id_daniel',  -- Temporäre ID, wird später durch echte Clerk ID ersetzt
  'daniel.kuhlen@telis-finanz',
  'Daniel',
  'Kuhlen',
  'Daniel Kuhlen',
  'admin',
  'GameChanger',
  '{"fa_daily": 0, "eh_daily": 0, "new_appointments_daily": 0, "recommendations_daily": 0, "tiv_invitations_daily": 0, "taa_invitations_daily": 0, "tgs_registrations_daily": 0, "bav_checks_daily": 0}',
  '{"fa_target": 0, "eh_target": 0, "new_appointments_target": 0, "recommendations_target": 0, "tiv_invitations_target": 0, "taa_invitations_target": 0, "tgs_registrations_target": 0, "bav_checks_target": 0}',
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  firstName = 'Daniel',
  lastName = 'Kuhlen',
  name = 'Daniel Kuhlen',
  team_name = 'GameChanger',
  updated_at = NOW();

-- Überprüfung: Zeige das Ergebnis
SELECT id, email, firstName, lastName, name, role, team_name, created_at 
FROM users 
WHERE email = 'daniel.kuhlen@telis-finanz';
