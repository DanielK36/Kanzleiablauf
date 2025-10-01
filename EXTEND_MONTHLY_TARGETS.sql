-- Erweitere monthly_targets JSONB Struktur
-- Statt nur aktueller Monat, speichern wir Ziele pro Monat

-- Beispiel-Struktur:
-- monthly_targets = {
--   "2024-10": {
--     "fa_monthly_target": 110,
--     "eh_monthly_target": 66,
--     ...
--   },
--   "2024-11": {
--     "fa_monthly_target": 120,
--     "eh_monthly_target": 70,
--     ...
--   }
-- }

-- Die bestehende Spalte ist bereits JSONB, wir müssen nur die Struktur erweitern
-- Keine Schema-Änderung nötig!

-- Kommentar hinzufügen
COMMENT ON COLUMN users.monthly_targets IS 
'Monatliche Ziele pro Monat im Format {"YYYY-MM": {targets...}}. Ab dem 20. werden Ziele für den Folgemonat gespeichert.';

-- Optional: Migriere bestehende personal_targets zu monthly_targets für aktuellen Monat
-- Dies ist nur ein Beispiel - ausführen wenn gewünscht
/*
UPDATE users
SET monthly_targets = jsonb_build_object(
  to_char(CURRENT_DATE, 'YYYY-MM'),
  jsonb_build_object(
    'fa_monthly_target', COALESCE((personal_targets->>'fa_monthly_target')::int, 0),
    'eh_monthly_target', COALESCE((personal_targets->>'eh_monthly_target')::int, 0),
    'new_appointments_monthly_target', COALESCE((personal_targets->>'new_appointments_monthly_target')::int, 0),
    'recommendations_monthly_target', COALESCE((personal_targets->>'recommendations_monthly_target')::int, 0),
    'tiv_invitations_monthly_target', COALESCE((personal_targets->>'tiv_invitations_monthly_target')::int, 0),
    'bav_checks_monthly_target', COALESCE((personal_targets->>'bav_checks_monthly_target')::int, 0),
    'taa_invitations_monthly_target', COALESCE((personal_targets->>'taa_invitations_monthly_target')::int, 0),
    'tgs_registrations_monthly_target', COALESCE((personal_targets->>'tgs_registrations_monthly_target')::int, 0)
  )
)
WHERE monthly_targets IS NULL OR monthly_targets = '{}'::jsonb;
*/

