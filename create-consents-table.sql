-- Erstelle consents Tabelle für Consent-Management
CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_version text NOT NULL,
  consent_date timestamptz DEFAULT now(),
  consent_given boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_consents_user_id ON consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_consent_given ON consents(consent_given);

-- Kommentare
COMMENT ON TABLE consents IS 'Speichert Einwilligungen der Nutzer zu Datenschutz und AGB';
COMMENT ON COLUMN consents.user_id IS 'Referenz auf users.id';
COMMENT ON COLUMN consents.consent_version IS 'Version der Datenschutzerklärung/AGB (z.B. "2025-09")';
COMMENT ON COLUMN consents.consent_given IS 'true = zugestimmt, false = abgelehnt';

