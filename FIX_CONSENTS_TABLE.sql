-- Fix: user_id darf NULL sein für neue User die noch kein Onboarding gemacht haben
ALTER TABLE consents 
ALTER COLUMN user_id DROP NOT NULL;

-- Erst NULL clerk_id Einträge updaten (aus user_id die clerk_id holen)
UPDATE consents
SET clerk_id = (
  SELECT clerk_id 
  FROM users 
  WHERE users.id = consents.user_id
)
WHERE clerk_id IS NULL AND user_id IS NOT NULL;

-- Dann clerk_id als NOT NULL setzen
ALTER TABLE consents 
ALTER COLUMN clerk_id SET NOT NULL;

-- Index für clerk_id hinzufügen
CREATE INDEX IF NOT EXISTS idx_consents_clerk_id ON consents(clerk_id);

-- Kommentar aktualisieren
COMMENT ON COLUMN consents.user_id IS 'Referenz auf users.id (NULL für User die noch kein Onboarding gemacht haben)';
COMMENT ON COLUMN consents.clerk_id IS 'Clerk User ID - immer vorhanden';

