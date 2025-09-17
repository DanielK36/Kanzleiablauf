-- Events Tabelle erstellen
-- Kopieren Sie dieses Script und führen Sie es in Ihrem Supabase SQL Editor aus

CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  day VARCHAR(20) NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  topic VARCHAR(255),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type VARCHAR(20) DEFAULT 'none',
  custom_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies erstellen
CREATE POLICY "Events are viewable by authenticated users" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Events are manageable by leaders" ON events
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role IN ('top_leader', 'sub_leader')
  ));

-- Beispiel-Daten einfügen
INSERT INTO events (type, date, day, time, location, topic, is_recurring, recurring_type) VALUES
('TIV', '2024-01-13', 'Samstag', '09:00 Uhr', 'Hauptbüro', '', false, 'none'),
('TAA', '2024-01-20', 'Samstag', '10:00 Uhr', 'Konferenzraum', '', false, 'none'),
('Telefonparty', '2024-01-16', 'Dienstag', '14:00-16:00 Uhr', 'Büro', 'Wöchentliche Telefonparty', true, 'weekly')
ON CONFLICT DO NOTHING;
