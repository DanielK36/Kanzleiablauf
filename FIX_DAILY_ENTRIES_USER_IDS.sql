-- Daily Entries von Philipp und Marcel korrigieren
-- Führe das in der Supabase SQL Console aus

-- 1. Philipps User-ID aus users Tabelle holen
-- (Wird automatisch durch die INSERT-Statements oben erstellt)

-- 2. Marcels User-ID aus users Tabelle holen
-- (Wird automatisch durch die INSERT-Statements oben erstellt)

-- 3. Daily Entries korrigieren
-- Philipps Einträge (die fälschlicherweise mit Daniels user_id gespeichert wurden)
-- Philipp hat 4 Einträge vom 20.09. bis 23.09.2025 gemacht
UPDATE daily_entries 
SET user_id = (
  SELECT id FROM users WHERE clerk_id = 'user_335biHQpHKEzRSLzPLJ5ZEJ1MwX'
)
WHERE user_id = '502e90ae-3557-48d1-8028-408fe9ee2c49'  -- Daniels user_id
  AND entry_date >= '2025-09-20'  -- Philipps Einträge ab 20.09.2025
  AND entry_date <= '2025-09-23';  -- bis heute (23.09.2025)

-- Marcel hat noch keine Einträge gemacht, daher keine Korrektur nötig

-- 4. Überprüfung: Zeige alle Daily Entries mit korrekten User-Namen
SELECT 
  de.id,
  de.entry_date,
  u.name as user_name,
  u.clerk_id,
  de.fa_count,
  de.eh_count,
  de.new_appointments,
  de.recommendations
FROM daily_entries de
JOIN users u ON de.user_id = u.id
WHERE de.entry_date >= '2025-09-15'
ORDER BY de.entry_date DESC, u.name;

-- 5. Überprüfung: Zeige alle User mit ihren Daily Entries
SELECT 
  u.name,
  u.clerk_id,
  COUNT(de.id) as daily_entries_count,
  MIN(de.entry_date) as first_entry,
  MAX(de.entry_date) as last_entry
FROM users u
LEFT JOIN daily_entries de ON u.id = de.user_id
WHERE u.clerk_id IN (
  'user_335biHQpHKEzRSLzPLJ5ZEJ1MwX',  -- Philipp
  'user_335kHjSPJxIxmDxWgyuv70kPIPr',  -- Marcel
  'user_323Fmf0gM8mLKTuHGu1rSjDy6gm',  -- Daniel
  'user_31slzzYqly0ElPQdIlWlOKwYA7w'   -- Kosta
)
GROUP BY u.id, u.name, u.clerk_id
ORDER BY u.name;
