-- Entfernt alle _daily Felder aus personal_targets JSONB
-- Die richtigen Werte sind in daily_entries gespeichert

-- 1. Prüfe aktuelle personal_targets Struktur
SELECT 
    name,
    personal_targets
FROM users 
WHERE personal_targets IS NOT NULL
ORDER BY name;

-- 2. Entferne alle _daily Felder aus personal_targets
UPDATE users 
SET personal_targets = personal_targets - ARRAY[
    'fa_daily',
    'eh_daily', 
    'new_appointments_daily',
    'recommendations_daily',
    'tiv_invitations_daily',
    'bav_checks_daily',
    'taa_invitations_daily',
    'tgs_registrations_daily'
]
WHERE personal_targets IS NOT NULL;

-- 3. Prüfe Ergebnis
SELECT 
    name,
    personal_targets
FROM users 
WHERE personal_targets IS NOT NULL
ORDER BY name;

-- 4. Zeige welche _daily Felder entfernt wurden
SELECT 
    name,
    jsonb_object_keys(personal_targets) as remaining_keys
FROM users 
WHERE personal_targets IS NOT NULL
ORDER BY name;
