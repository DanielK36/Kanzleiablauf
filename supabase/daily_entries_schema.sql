-- Daily Entries System - Complete Schema
-- Erweitert das bestehende Leadership System

-- 1. Daily Entries Table (Berater-Eingaben)
CREATE TABLE IF NOT EXISTS daily_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    
    -- Standard-Metriken
    fa_count INTEGER DEFAULT 0,
    eh_count INTEGER DEFAULT 0,
    new_appointments INTEGER DEFAULT 0,
    tiv_count INTEGER DEFAULT 0,
    taa_count INTEGER DEFAULT 0,
    recommendations INTEGER DEFAULT 0,
    
    -- ToDos (als JSON Array)
    todos JSONB DEFAULT '[]',
    
    -- Wochentag-spezifische Felder
    focus_area VARCHAR(100), -- "Neukunden", "neue Berater", "mehr Empfehlungen"
    help_request TEXT, -- "Wie kann dir deine Führungskraft heute helfen?"
    
    -- Montag-spezifisch
    weekend_positive TEXT, -- "Was habe ich am Wochenende arbeitsmäßig Positives erlebt?"
    training_diamonds TEXT, -- "Was waren deine Diamanten vom Samstag?"
    saturday_appointments JSONB DEFAULT '[]', -- neue Termine für Samstag
    
    -- Mittwoch-spezifisch
    tiv_invitations INTEGER DEFAULT 0,
    taa_invitations INTEGER DEFAULT 0,
    
    -- Donnerstag-spezifisch
    recommendation_effort TEXT, -- "Wie machst du dich heute empfehlenswerter?"
    recommendation_expansion TEXT, -- "Wie sorgst du heute dafür, deine Empfehlungsliste zu erweitern?"
    
    -- Freitag-spezifisch
    week_positive TEXT, -- "Was lief diese Woche gut?"
    week_learnings TEXT, -- "Was lernst du daraus?"
    saturday_participation BOOLEAN DEFAULT false,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one entry per user per day
    UNIQUE(user_id, entry_date)
);

-- 2. Team Data Table (Führungskraft-Daten)
CREATE TABLE IF NOT EXISTS team_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    
    -- Aggregierte Team-Daten
    team_fa_total INTEGER DEFAULT 0,
    team_eh_total INTEGER DEFAULT 0,
    team_appointments_total INTEGER DEFAULT 0,
    team_recommendations_total INTEGER DEFAULT 0,
    
    -- Kommentare je Berater (als JSON)
    advisor_comments JSONB DEFAULT '{}',
    
    -- Tagesfokus
    daily_focus TEXT,
    daily_summary TEXT,
    
    -- Vortag/Heute Vergleich
    yesterday_goals JSONB DEFAULT '{}',
    yesterday_results JSONB DEFAULT '{}',
    today_goals JSONB DEFAULT '{}',
    today_planning JSONB DEFAULT '{}',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one entry per team per day
    UNIQUE(team_id, entry_date)
);

-- 3. Kanzlei Meta Table (Samstag-Daten)
CREATE TABLE IF NOT EXISTS kanzlei_meta (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    
    -- Samstag-Events
    tiv_participants INTEGER DEFAULT 0,
    taa_participants INTEGER DEFAULT 0,
    powermeeting_participants INTEGER DEFAULT 0,
    
    -- Team-Größe für Quotenberechnung
    team_size INTEGER DEFAULT 0,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one entry per team per event date
    UNIQUE(team_id, event_date)
);

-- 4. Recommendations Table (Empfehlungs-Engine)
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    
    -- Empfehlungs-Logik
    recommendation_type VARCHAR(50), -- "mindmap", "empfehlung", "fridolin", etc.
    recommendation_text TEXT,
    recommendation_trigger JSONB, -- Welche Bedingungen haben die Empfehlung ausgelöst
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_applied BOOLEAN DEFAULT false,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one recommendation per user per day per type
    UNIQUE(user_id, entry_date, recommendation_type)
);

-- 5. Weekly Goals Table (Wochenziele)
CREATE TABLE IF NOT EXISTS weekly_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL, -- Montag der Woche
    
    -- Wochenziel
    weekly_goal TEXT,
    goal_category VARCHAR(50), -- "Neukunden", "neue Berater", "mehr Empfehlungen"
    
    -- Status
    is_completed BOOLEAN DEFAULT false,
    completion_notes TEXT,
    next_week_focus TEXT,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one goal per user per week
    UNIQUE(user_id, week_start_date)
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON daily_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_team_data_team_date ON team_data(team_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_kanzlei_meta_team_date ON kanzlei_meta(team_id, event_date);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_date ON recommendations(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_week ON weekly_goals(user_id, week_start_date);

-- RLS Policies (vereinfacht für Clerk)
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanzlei_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;

-- Temporär RLS deaktivieren für Entwicklung
ALTER TABLE daily_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE kanzlei_meta DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals DISABLE ROW LEVEL SECURITY;
