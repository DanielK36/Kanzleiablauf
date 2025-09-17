-- Leadership Enablement System Database Schema
-- Automatically expires data after 30 days for GDPR compliance

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Users with hierarchical support
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('advisor', 'sub_leader', 'top_leader')) NOT NULL,
  parent_leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_name TEXT,
  personal_targets JSONB DEFAULT '{"fa_daily": 5, "eh_daily": 3, "tiv_daily": 2, "appointments_daily": 3}',
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tägliche Leadership-Reflexion
CREATE TABLE leadership_reflections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  energy_level TEXT CHECK (energy_level IN ('high', 'medium', 'low')) NOT NULL,
  daily_leadership_goal TEXT NOT NULL,
  team_focus_priority TEXT NOT NULL,
  personal_challenges TEXT,
  success_from_yesterday TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(leader_id, date)
);

-- Advisor Daily Check-ins (wochentagsspezifisch)
CREATE TABLE advisor_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weekday_focus TEXT CHECK (weekday_focus IN ('monday_review', 'tuesday_prospects', 'wednesday_recruiting', 'thursday_training', 'friday_planning', 'saturday_events', 'sunday_reflection')) NOT NULL,
  
  -- Basis-Performance für Kontext
  daily_numbers JSONB DEFAULT '{"fa": 0, "eh": 0, "tiv": 0, "appointments": 0}',
  
  -- Wochentagsspezifische Reflexion
  focus_responses JSONB,
  energy_today TEXT CHECK (energy_today IN ('high', 'medium', 'low')) NOT NULL,
  support_needed TEXT,
  wins_to_share TEXT,
  
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(advisor_id, date)
);

-- Konkrete Handlungsleitfäden pro Wochentag
CREATE TABLE action_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekday TEXT CHECK (weekday IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')) NOT NULL,
  focus_area TEXT NOT NULL,
  target_role TEXT CHECK (target_role IN ('advisor', 'leader')) NOT NULL,
  
  steps JSONB NOT NULL,
  scripts JSONB,
  tools JSONB,
  success_indicators JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(weekday, target_role)
);

-- Team-Koordination und Coaching-Notizen
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session_type TEXT CHECK (session_type IN ('daily_guidance', 'support_intervention', 'momentum_building')) NOT NULL,
  
  identified_challenges JSONB,
  given_guidance JSONB,
  next_actions JSONB,
  follow_up_needed BOOLEAN DEFAULT false,
  
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Hierarchie-Management
CREATE TABLE team_structure (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  top_leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_hierarchy JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(top_leader_id)
);

-- Indexes for performance
CREATE INDEX idx_users_parent_leader_id ON users(parent_leader_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_leadership_reflections_leader_date ON leadership_reflections(leader_id, date);
CREATE INDEX idx_advisor_checkins_advisor_date ON advisor_checkins(advisor_id, date);
CREATE INDEX idx_coaching_sessions_leader_advisor ON coaching_sessions(leader_id, advisor_id);
CREATE INDEX idx_expires_at ON leadership_reflections(expires_at);
CREATE INDEX idx_expires_at_checkins ON advisor_checkins(expires_at);
CREATE INDEX idx_expires_at_coaching ON coaching_sessions(expires_at);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leadership_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_structure ENABLE ROW LEVEL SECURITY;

-- Users can see themselves and their team members
CREATE POLICY "Users can view own data and team" ON users
  FOR SELECT USING (
    auth.uid()::text = clerk_id OR 
    id IN (
      SELECT id FROM users WHERE parent_leader_id = (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    ) OR
    parent_leader_id = (
      SELECT id FROM users WHERE clerk_id = auth.uid()::text
    )
  );

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = clerk_id);

-- Leadership reflections are private to the leader
CREATE POLICY "Leaders can manage own reflections" ON leadership_reflections
  FOR ALL USING (
    leader_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Advisor checkins are visible to the advisor and their leader
CREATE POLICY "Advisors and leaders can manage checkins" ON advisor_checkins
  FOR ALL USING (
    advisor_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    advisor_id IN (
      SELECT id FROM users WHERE parent_leader_id = (
        SELECT id FROM users WHERE clerk_id = auth.uid()::text
      )
    )
  );

-- Action guides are public (read-only for all authenticated users)
CREATE POLICY "All users can read action guides" ON action_guides
  FOR SELECT USING (auth.role() = 'authenticated');

-- Coaching sessions are visible to involved parties
CREATE POLICY "Coaching sessions visible to participants" ON coaching_sessions
  FOR ALL USING (
    leader_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    advisor_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
  );

-- Team structure is visible to team members
CREATE POLICY "Team structure visible to team members" ON team_structure
  FOR SELECT USING (
    top_leader_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
    top_leader_id = (SELECT parent_leader_id FROM users WHERE clerk_id = auth.uid()::text) OR
    id IN (
      SELECT id FROM users WHERE parent_leader_id = top_leader_id
    )
  );

-- Function to automatically clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  DELETE FROM leadership_reflections WHERE expires_at < now();
  DELETE FROM advisor_checkins WHERE expires_at < now();
  DELETE FROM coaching_sessions WHERE expires_at < now();
  
  -- Log cleanup activity
  INSERT INTO team_structure (top_leader_id, team_hierarchy, updated_at)
  VALUES (
    (SELECT id FROM users WHERE role = 'top_leader' LIMIT 1),
    jsonb_build_object('cleanup_log', jsonb_build_object('last_cleanup', now())),
    now()
  )
  ON CONFLICT (top_leader_id) 
  DO UPDATE SET 
    team_hierarchy = team_structure.team_hierarchy || jsonb_build_object('cleanup_log', jsonb_build_object('last_cleanup', now())),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Schedule automatic cleanup daily at 1 AM
SELECT cron.schedule('cleanup-expired-data', '0 1 * * *', 'SELECT cleanup_expired_data();');

-- Function to determine user role based on hierarchy
CREATE OR REPLACE FUNCTION determine_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  subordinate_count INTEGER;
  sub_leader_count INTEGER;
BEGIN
  -- Count direct subordinates
  SELECT COUNT(*) INTO subordinate_count
  FROM users 
  WHERE parent_leader_id = user_id;
  
  -- If no subordinates, user is advisor
  IF subordinate_count = 0 THEN
    RETURN 'advisor';
  END IF;
  
  -- Count sub-leaders among subordinates
  SELECT COUNT(*) INTO sub_leader_count
  FROM users 
  WHERE parent_leader_id = user_id AND role = 'sub_leader';
  
  -- If has sub-leaders, user is top_leader
  IF sub_leader_count > 0 THEN
    RETURN 'top_leader';
  ELSE
    RETURN 'sub_leader';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert default action guides
INSERT INTO action_guides (weekday, focus_area, target_role, steps, scripts, success_indicators) VALUES
('monday', 'Nacharbeit & Wochenziele', 'leader', 
 '["Öffne das Wochenend-Seminar-Protokoll", "Identifiziere die 3 wichtigsten Follow-ups", "Weise jedem Berater 1-2 konkrete Nacharbeiten zu", "Definiere klare Wochenziele: FA/EH/TIV pro Person", "Führe strukturierte Morgenbesprechung durch"]',
 '["Max, deine Nacharbeit heute: Anruf bei Familie Schmidt wegen...", "Sarah, dein Wochenziel: 5 FA und 3 EH", "Team, heute fokussieren wir uns auf..."]',
 '["Alle Follow-ups zugewiesen", "Wochenziele definiert", "Morgenbesprechung strukturiert durchgeführt"]'),

('monday', 'Nacharbeit & Wochenziele', 'advisor',
 '["Liste alle Kontakte vom Wochenend-Seminar auf", "Priorisiere: Wer war am interessiertesten?", "Rufe die Top 3 bis 14:00 Uhr an", "Dokumentiere Ergebnisse für Morgenbesprechung morgen", "Plane konkrete Nacharbeiten für die Woche"]',
 '["Hallo Familie Schmidt, wie versprochen rufe ich an...", "Herr Müller, Sie hatten Interesse an...", "Frau Weber, können wir einen Termin vereinbaren?"]',
 '["3 Anrufe geführt", "Mindestens 1 Termin vereinbart", "Ergebnisse dokumentiert"]'),

('tuesday', 'Potenziale & Neukundengewinnung', 'leader',
 '["Öffne deine Kontakt-Mindmap", "Wähle 5 Namen aus der \"Letzte 6 Monate\" Spalte", "Bereite Einladungsscript für Infoabend vor", "Terminiere 3 Anrufe für heute Nachmittag", "Unterstütze Team bei Neukundengewinnung"]',
 '["Hi Peter, wir haben eine neue Lösung für...", "Max, unterstütze Sarah bei ihren Anrufen", "Team, heute fokussieren wir auf Potenzialentwicklung"]',
 '["5 Kontakte identifiziert", "3 Anrufe geplant", "Team unterstützt"]'),

('tuesday', 'Potenziale & Neukundengewinnung', 'advisor',
 '["Mindmap aktualisieren: Wen habe ich vergessen?", "3 Personen anrufen, die länger nichts gehört haben", "Bestehende Kunden nach Empfehlungen fragen", "Termine für Donnerstag generieren", "Ergebnisse dokumentieren"]',
 '["Herr Müller, kennen Sie jemanden, der...?", "Hi [Name], hier ist [Dein Name]. Wir hatten uns vor einiger Zeit über [Thema] unterhalten...", "Frau Schmidt, können Sie mir jemanden empfehlen?"]',
 '["3 Anrufe geführt", "Mindestens 1 Empfehlung erhalten", "Termine für Donnerstag geplant"]'),

('wednesday', 'Recruiting & Geschäftspartner', 'leader',
 '["Überprüfe Recruiting-Pipeline: Wer ist in Gesprächen?", "Bereite Opportunity-Scripts vor", "Identifiziere potenzielle Kandidaten im Team-Umfeld", "Plane Recruiting-Termine für diese Woche", "Coache Team bei Recruiting-Aktivitäten"]',
 '["Sarah, ich sehe bei dir Potenzial für mehr Verantwortung...", "Max, wer in deinem Umfeld sucht berufliche Veränderung?", "Team, heute fokussieren wir auf Recruiting"]',
 '["Pipeline überprüft", "Scripts vorbereitet", "Recruiting-Termine geplant"]'),

('wednesday', 'Recruiting & Geschäftspartner', 'advisor',
 '["Liste interessante Personen aus deinem Umfeld auf", "Wer sucht berufliche Veränderung?", "Lade 1 Person zum Informationsgespräch ein", "Bereite Opportunity-Präsentation vor", "Dokumentiere Recruiting-Aktivitäten"]',
 '["Du hast doch mal gesagt, du suchst was Neues...", "Ich habe eine interessante Möglichkeit für dich...", "Hättest du Lust auf ein unverbindliches Gespräch?"]',
 '["1 Person eingeladen", "Präsentation vorbereitet", "Aktivitäten dokumentiert"]');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_structure_updated_at BEFORE UPDATE ON team_structure
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

