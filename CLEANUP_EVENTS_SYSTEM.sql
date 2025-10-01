-- CLEANUP EVENTS SYSTEM - Entfernt unnötige Einträge und bereitet für neues System vor
-- Führen Sie dieses Script in Ihrem Supabase SQL Editor aus

-- 1. Lösche alle bestehenden Events (da sie veraltet sind)
DELETE FROM event_registrations;
DELETE FROM event_speakers;
DELETE FROM speakers;
DELETE FROM events;

-- 2. Erstelle neue, saubere Events-Tabelle
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS speakers CASCADE;
DROP TABLE IF EXISTS event_speakers CASCADE;
DROP TABLE IF EXISTS event_registrations CASCADE;

-- 3. Neue Events-Tabelle (vereinfacht)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    max_participants INTEGER DEFAULT NULL,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planned', -- planned, active, completed, cancelled
    event_type VARCHAR(100) DEFAULT 'seminar',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_type VARCHAR(50) DEFAULT 'none', -- none, weekly, monthly
    recurrence_days INTEGER[] DEFAULT '{}', -- Array of weekdays (1=Monday, 7=Sunday)
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_end_date DATE,
    parent_event_id UUID REFERENCES events(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Neue Speakers-Tabelle (vereinfacht)
CREATE TABLE speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Verknüpfung zu bestehenden Benutzern
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    bio TEXT,
    expertise_areas TEXT[],
    hourly_rate DECIMAL(10,2),
    availability_status VARCHAR(50) DEFAULT 'available',
    is_verified BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE, -- Admin muss Referenten freigeben
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Event-Speakers Junction Table
CREATE TABLE event_speakers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'speaker',
    topic VARCHAR(255),
    presentation_duration INTEGER,
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmation_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, speaker_id)
);

-- 6. Event Registrations
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'registered',
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 7. Indexes für Performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_recurring ON events(is_recurring);
CREATE INDEX idx_speakers_user_id ON speakers(user_id);
CREATE INDEX idx_speakers_approved ON speakers(is_approved);
CREATE INDEX idx_event_speakers_event_id ON event_speakers(event_id);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);

-- 8. Kommentare
COMMENT ON TABLE events IS 'Veranstaltungen mit wöchentlicher Wiederholung';
COMMENT ON TABLE speakers IS 'Referenten - können sich auf Events bewerben';
COMMENT ON TABLE event_speakers IS 'Verknüpfung Events <-> Referenten';
COMMENT ON TABLE event_registrations IS 'Teilnehmer-Registrierungen für Events';

-- 9. Beispiel-Events erstellen
INSERT INTO events (title, description, event_date, start_time, end_time, location, event_type, is_recurring, recurrence_type, recurrence_days) VALUES
('TIV Training', 'Finanzanalysen Training für Berater', CURRENT_DATE + INTERVAL '7 days', '09:00', '17:00', 'Schulungsraum 1', 'training', true, 'weekly', '{2}'), -- Dienstag
('TAA Workshop', 'Telefonakquise Workshop', CURRENT_DATE + INTERVAL '14 days', '10:00', '16:00', 'Konferenzraum A', 'workshop', true, 'weekly', '{3}'), -- Mittwoch
('Powermeeting', 'Wöchentliches Teammeeting', CURRENT_DATE + INTERVAL '3 days', '08:30', '10:00', 'Hauptkonferenzraum', 'meeting', true, 'weekly', '{1}'); -- Montag
