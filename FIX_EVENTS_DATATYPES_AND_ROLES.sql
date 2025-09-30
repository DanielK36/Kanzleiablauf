-- FIX EVENTS SYSTEM - Corrects datatype issues and role structure
-- This script fixes the UUID vs INTEGER conflict and corrects the role system

-- 1. Check current state
SELECT 'CURRENT STATE - All tables:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

SELECT 'CURRENT STATE - Users roles:' as status;
SELECT DISTINCT role FROM users;

-- 2. Drop all existing event-related tables to start fresh
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS event_speakers CASCADE;
DROP TABLE IF EXISTS speakers CASCADE;
DROP TABLE IF EXISTS events CASCADE;

-- 3. Create events table with UUID (matching users table)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    max_participants INTEGER DEFAULT NULL, -- NULL = unlimited
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planned', -- planned, active, completed, cancelled
    event_type VARCHAR(100) DEFAULT 'seminar', -- seminar, workshop, training, meeting
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_type VARCHAR(50) DEFAULT 'none', -- none, weekly, monthly, custom
    recurrence_days INTEGER[] DEFAULT '{}', -- Array of weekdays (1=Monday, 7=Sunday)
    recurrence_interval INTEGER DEFAULT 1, -- Every X weeks/months
    recurrence_end_date DATE, -- End date for recurrence
    parent_event_id UUID REFERENCES events(id), -- For recurring event instances
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create speakers table with UUID
CREATE TABLE speakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    position VARCHAR(255),
    bio TEXT,
    expertise_areas TEXT[], -- Array of expertise areas
    hourly_rate DECIMAL(10,2),
    availability_status VARCHAR(50) DEFAULT 'available', -- available, busy, unavailable
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create event_speakers junction table with UUID
CREATE TABLE event_speakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'speaker', -- speaker, moderator, panelist
    topic VARCHAR(255),
    presentation_duration INTEGER, -- in minutes
    is_confirmed BOOLEAN DEFAULT FALSE,
    confirmation_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, speaker_id)
);

-- 6. Create event_registrations table with UUID
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'registered', -- registered, confirmed, cancelled, attended
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 7. Add indexes for better performance
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_recurring ON events(is_recurring);
CREATE INDEX idx_events_parent ON events(parent_event_id);
CREATE INDEX idx_speakers_email ON speakers(email);
CREATE INDEX idx_speakers_status ON speakers(availability_status);
CREATE INDEX idx_event_speakers_event ON event_speakers(event_id);
CREATE INDEX idx_event_speakers_speaker ON event_speakers(speaker_id);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);

-- 8. Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies with CORRECTED role structure
-- Events policies
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

CREATE POLICY "Events can be created by admins and leaders" ON events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'top_leader', 'sub_leader')
        )
    );

CREATE POLICY "Events can be updated by admins and leaders" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'top_leader', 'sub_leader')
        )
    );

CREATE POLICY "Events can be deleted by admins and leaders" ON events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'top_leader', 'sub_leader')
        )
    );

-- Speakers policies
CREATE POLICY "Speakers are viewable by everyone" ON speakers
    FOR SELECT USING (true);

CREATE POLICY "Speakers can be created by anyone" ON speakers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Speakers can update their own profile" ON speakers
    FOR UPDATE USING (
        email = auth.jwt() ->> 'email' OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'top_leader', 'sub_leader')
        )
    );

-- Event speakers policies
CREATE POLICY "Event speakers are viewable by everyone" ON event_speakers
    FOR SELECT USING (true);

CREATE POLICY "Event speakers can be managed by admins and leaders" ON event_speakers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'top_leader', 'sub_leader')
        )
    );

-- Event registrations policies
CREATE POLICY "Event registrations are viewable by users" ON event_registrations
    FOR SELECT USING (
        user_id = (
            SELECT id FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'top_leader', 'sub_leader')
        )
    );

CREATE POLICY "Users can register for events" ON event_registrations
    FOR INSERT WITH CHECK (
        user_id = (
            SELECT id FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can update their own registrations" ON event_registrations
    FOR UPDATE USING (
        user_id = (
            SELECT id FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'top_leader', 'sub_leader')
        )
    );

-- 10. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_speakers_updated_at BEFORE UPDATE ON speakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_speakers_updated_at BEFORE UPDATE ON event_speakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert sample data
INSERT INTO events (
    title, description, event_date, start_time, end_time, location,
    event_type, status, is_recurring, recurrence_type, recurrence_days, recurrence_end_date
) VALUES
('TIV Schulung', 'TIV Schulung für neue Berater', CURRENT_DATE + INTERVAL '7 days', '09:00', '17:00', 'Hauptbüro', 'training', 'planned', FALSE, 'none', '{}', NULL),
('Wöchentliches Team-Meeting', 'Regelmäßiges Team-Meeting', CURRENT_DATE + INTERVAL '1 day', '09:00', '10:00', 'Konferenzraum', 'meeting', 'planned', TRUE, 'weekly', '{}', CURRENT_DATE + INTERVAL '3 months'),
('TAA Training', 'TAA Training Dienstag und Donnerstag', CURRENT_DATE + INTERVAL '2 days', '14:00', '16:00', 'Schulungsraum', 'training', 'planned', TRUE, 'custom', '{2,4}', CURRENT_DATE + INTERVAL '6 months'),
('Powermeeting', 'Monatliches Powermeeting', CURRENT_DATE + INTERVAL '3 days', '16:00', '18:00', 'Hauptbüro', 'meeting', 'planned', TRUE, 'weekly', '{}', CURRENT_DATE + INTERVAL '1 year')
ON CONFLICT DO NOTHING;

-- Insert sample speakers
INSERT INTO speakers (
    first_name, last_name, email, phone, company, position, bio, expertise_areas, hourly_rate, availability_status, is_verified
) VALUES
('Dr. Michael', 'Schmidt', 'michael.schmidt@finance-expert.de', '+49 30 12345678', 'Finance Expert GmbH', 'Senior Berater', 'Experte für Finanzberatung mit über 15 Jahren Erfahrung', ARRAY['Finanzberatung', 'Vermögensaufbau', 'Rentenberatung'], 150.00, 'available', TRUE),
('Sarah', 'Müller', 'sarah.mueller@consulting.de', '+49 30 87654321', 'Consulting Plus', 'Beratungsleiterin', 'Spezialistin für Kundenkommunikation und Beratungsprozesse', ARRAY['Kommunikation', 'Beratungsprozesse', 'Kundenbetreuung'], 120.00, 'available', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 12. Verify the final setup
SELECT 'FINAL EVENTS TABLE SCHEMA:' as status;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'SAMPLE EVENTS:' as status;
SELECT id, title, event_date, event_type, is_recurring, recurrence_type, recurrence_days
FROM events
ORDER BY event_date;

SELECT 'SAMPLE SPEAKERS:' as status;
SELECT id, first_name, last_name, email, company, is_verified
FROM speakers;

-- Success message
SELECT 'Events system fixed with correct UUID datatypes and role structure!' as status;
