-- Füge clerk_id Spalte zur consents Tabelle hinzu
ALTER TABLE consents ADD COLUMN IF NOT EXISTS clerk_id text;

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_consents_clerk_id ON consents(clerk_id);

-- Kommentar
COMMENT ON COLUMN consents.clerk_id IS 'Clerk User ID für temporäre Consents vor Onboarding';
