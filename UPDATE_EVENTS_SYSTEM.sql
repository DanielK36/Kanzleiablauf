-- UPDATE EVENTS SYSTEM - Vereinfacht und überarbeitet
-- Führen Sie dieses Script in Ihrem Supabase SQL Editor aus

-- 1. Entferne Teilnehmer-Felder aus Events
ALTER TABLE events DROP COLUMN IF EXISTS max_participants;
ALTER TABLE events DROP COLUMN IF EXISTS current_participants;

-- 2. Entferne unnötige Felder aus Speakers
ALTER TABLE speakers DROP COLUMN IF EXISTS phone;
ALTER TABLE speakers DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE speakers DROP COLUMN IF EXISTS company;
ALTER TABLE speakers DROP COLUMN IF EXISTS position;

-- 3. Füge Event-Typ und Thema hinzu
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_category VARCHAR(50) DEFAULT 'TIV'; -- TIV, TAA, Powermeeting
ALTER TABLE events ADD COLUMN IF NOT EXISTS topic VARCHAR(255); -- Thema der Veranstaltung

-- 4. Erstelle Event-Topics Tabelle für Admin-Verwaltung
CREATE TABLE IF NOT EXISTS event_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_category VARCHAR(50) NOT NULL, -- TIV, TAA, Powermeeting
    topic_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Füge Standard-Topics hinzu (nur für TAA)
INSERT INTO event_topics (event_category, topic_name, description) VALUES
('TAA', 'Empfehlungen', 'Empfehlungsmarketing und Kundenempfehlungen'),
('TAA', 'Potenziale/Telefontraining', 'Telefontraining für Potenzialkunden'),
('TAA', 'Firmenpräsentationsgespräch', 'Professionelle Firmenpräsentation'),
('TAA', 'Finanzanalyse', 'Finanzanalysen für Kunden')
ON CONFLICT DO NOTHING;

-- 6. Erstelle Speaker-Registrations Tabelle für 4-Monats-Übersicht
CREATE TABLE IF NOT EXISTS speaker_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'registered', -- registered, confirmed, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(speaker_id, event_id)
);

-- 7. Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_events_category ON events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_topic ON events(topic);
CREATE INDEX IF NOT EXISTS idx_event_topics_category ON event_topics(event_category);
CREATE INDEX IF NOT EXISTS idx_speaker_registrations_speaker_id ON speaker_registrations(speaker_id);
CREATE INDEX IF NOT EXISTS idx_speaker_registrations_event_id ON speaker_registrations(event_id);

-- 8. Kommentare
COMMENT ON TABLE event_topics IS 'Verwaltbare Topics für Events nach Kategorie';
COMMENT ON TABLE speaker_registrations IS 'Referenten-Anmeldungen für spezifische Events';
COMMENT ON COLUMN events.event_category IS 'Event-Kategorie: TIV, TAA, Powermeeting';
COMMENT ON COLUMN events.topic IS 'Spezifisches Thema der Veranstaltung';

-- 9. Update bestehende Events mit Kategorien
UPDATE events SET event_category = 'TIV' WHERE title ILIKE '%TIV%' OR title ILIKE '%Finanz%';
UPDATE events SET event_category = 'TAA' WHERE title ILIKE '%TAA%' OR title ILIKE '%Telefon%';
UPDATE events SET event_category = 'Powermeeting' WHERE title ILIKE '%Power%' OR title ILIKE '%Meeting%';
