-- Daniels Name korrigieren
-- Führe das in der Supabase SQL Console aus

-- 1. Daniels Namen korrigieren
UPDATE users 
SET 
  name = 'Daniel Kuhlen',
  firstname = 'Daniel',
  lastname = 'Kuhlen',
  updated_at = NOW()
WHERE clerk_id = 'user_323Fmf0gM8mLKTuHGu1rSjDy6gm';

-- 2. Philipps Team und Rolle korrigieren
UPDATE users 
SET 
  team_name = 'Visionäre',
  role = 'führungskraft',
  is_team_leader = true,
  is_authorized_leader = true,
  updated_at = NOW()
WHERE clerk_id = 'user_335biHQpHKEzRSLzPLJ5ZEJ1MwX';

-- 3. Marcels Team korrigieren
UPDATE users 
SET 
  team_name = 'Visionäre',
  role = 'berater',
  is_team_leader = false,
  is_authorized_leader = false,
  updated_at = NOW()
WHERE clerk_id = 'user_335kHjSPJxIxmDxWgyuv70kPIPr';

-- 4. Überprüfung: Zeige alle User
SELECT 
  id,
  clerk_id,
  email,
  firstname,
  lastname,
  name,
  role,
  team_name,
  is_team_leader,
  is_authorized_leader,
  created_at
FROM users 
ORDER BY created_at DESC;
