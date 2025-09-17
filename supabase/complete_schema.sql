-- Complete Leadership Enablement System Database Schema
-- This file contains all necessary tables and configurations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Users with hierarchical support
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('advisor', 'sub_leader', 'top_leader', 'trainee')) NOT NULL,
  parent_leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_name TEXT,
  personal_targets JSONB DEFAULT '{"fa_daily": 5, "eh_daily": 3, "new_appointments_daily": 3, "recommendations_daily": 2, "tiv_invitations_daily": 2, "taa_invitations_daily": 1, "tgs_registrations_daily": 1, "bav_checks_daily": 2}',
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily Entries Table (Berater-Eingaben)
CREATE TABLE IF NOT EXISTS daily_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    
    -- 8 Standard-Metriken (erweitert)
    fa_count INTEGER DEFAULT 0,
    eh_count INTEGER DEFAULT 0,
    new_appointments INTEGER DEFAULT 0,
    recommendations INTEGER DEFAULT 0,
    tiv_invitations INTEGER DEFAULT 0,
    taa_invitations INTEGER DEFAULT 0,
    tgs_registrations INTEGER DEFAULT 0,
    bav_checks INTEGER DEFAULT 0,
    
    -- ToDos (als JSON Array mit Status)
    todos JSONB DEFAULT '[]', -- [{"text": "Task", "completed": false, "carried_over": false}]
    
    -- Wochentag-spezifische Fragen
    weekday_questions JSONB DEFAULT '{}', -- Speichert Antworten auf tagesabhängige Fragen
    
    -- Standard-Fragen
    highlight_yesterday TEXT, -- "Was war dein Highlight gestern?"
    appointments_next_week INTEGER DEFAULT 0, -- "Wie viele Termine stehen für nächste Woche an?"
    improvement_today TEXT, -- "Was machst du heute noch besser?"
    
    -- Heutige Ziele und ToDos
    today_goals JSONB DEFAULT '{}', -- Heutige Zielzahlen
    today_todos JSONB DEFAULT '[]', -- Heutige ToDos als Freitextfelder
    help_needed TEXT, -- "Wobei brauchst du heute Hilfe?"
    training_focus TEXT, -- "Was willst du heute trainieren?"
    weekly_improvement TEXT, -- "Worin hast du dich die Woche besonders verbessert?"
    
    -- Automatische ToDo-Generierung
    auto_generated_todos JSONB DEFAULT '[]', -- Automatisch generierte ToDos basierend auf Empfehlungen
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one entry per user per day
    UNIQUE(user_id, entry_date)
);

-- Weekly Goals Table (Wochenziele) - erweitert
CREATE TABLE IF NOT EXISTS weekly_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL, -- Montag der Woche
    
    -- 8 Wochenzielzahlen
    fa_weekly_target INTEGER DEFAULT 0,
    eh_weekly_target INTEGER DEFAULT 0,
    new_appointments_weekly_target INTEGER DEFAULT 0,
    recommendations_weekly_target INTEGER DEFAULT 0,
    tiv_invitations_weekly_target INTEGER DEFAULT 0,
    taa_invitations_weekly_target INTEGER DEFAULT 0,
    tgs_registrations_weekly_target INTEGER DEFAULT 0,
    bav_checks_weekly_target INTEGER DEFAULT 0,
    
    -- Zusätzliches Ziel
    additional_goal TEXT, -- "Was willst du nächste Woche anders machen?"
    
    -- Status
    is_completed BOOLEAN DEFAULT false,
    completion_notes TEXT,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one goal per user per week
    UNIQUE(user_id, week_start_date)
);

-- Team Data Table (Führungskraft-Daten) - erweitert
CREATE TABLE IF NOT EXISTS team_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    
    -- Aggregierte Team-Daten (8 Metriken)
    team_fa_total INTEGER DEFAULT 0,
    team_eh_total INTEGER DEFAULT 0,
    team_new_appointments_total INTEGER DEFAULT 0,
    team_recommendations_total INTEGER DEFAULT 0,
    team_tiv_invitations_total INTEGER DEFAULT 0,
    team_taa_invitations_total INTEGER DEFAULT 0,
    team_tgs_registrations_total INTEGER DEFAULT 0,
    team_bav_checks_total INTEGER DEFAULT 0,
    
    -- Berater-spezifische Daten
    advisor_data JSONB DEFAULT '{}', -- Detaillierte Daten pro Berater
    
    -- Tagesfokus
    daily_focus TEXT,
    training_topic TEXT, -- "Was wird heute trainiert?"
    phone_party_time TEXT, -- "Wann ist Telefonparty?"
    training_responsible UUID REFERENCES users(id), -- Wer ist verantwortlich für Training
    phone_party_responsible UUID REFERENCES users(id), -- Wer ist verantwortlich für Telefonparty
    
    -- Gefühls-Check
    team_mood JSONB DEFAULT '{}', -- Gefühls-Check pro Berater
    
    -- Freitext-Felder
    change_request TEXT, -- "Was willst du heute ändern?"
    evening_feeling TEXT, -- "Wie fühlst du dich heute abend wenn du das erreicht hast?"
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one entry per team per day
    UNIQUE(team_id, entry_date)
);

-- Weekly Review Table (Wochenrückblick für Führungskräfte)
CREATE TABLE IF NOT EXISTS weekly_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    leader_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL, -- Montag der Woche
    
    -- Wochenrückblick-Fragen
    opened_up_this_week TEXT, -- "Wer hat sich diese Woche besonders geöffnet?"
    how_to_honor TEXT, -- "Und wie kannst du das ehren?"
    next_week_movement TEXT, -- "Wen möchtest du nächste Woche neu in Bewegung bringen?"
    strongest_moment TEXT, -- "Was war diese Woche dein stärkster Moment?"
    surprise_member TEXT, -- "Wer hat dich überrascht – positive oder herausfordernd?"
    struggling_member TEXT, -- "Wer ist diese Woche untergegangen?"
    next_week_focus TEXT, -- "Welcher Fokus steht für nächste Woche an?"
    
    -- Status
    is_completed BOOLEAN DEFAULT false,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one review per leader per week
    UNIQUE(leader_id, week_start_date)
);

-- Recommendations Table (Empfehlungs-Engine) - erweitert
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    
    -- Empfehlungs-Logik basierend auf Monatsdurchschnitt
    recommendation_type VARCHAR(50), -- "new_customers", "new_partners", "more_recommendations", "more_eh"
    recommendation_text TEXT,
    recommendation_trigger JSONB, -- Welche Bedingungen haben die Empfehlung ausgelöst
    monthly_averages JSONB, -- Aktuelle Monatsdurchschnitte
    
    -- Spezifische Empfehlungen
    new_customers_suggestions JSONB DEFAULT '[]', -- MindMap, Netzwerken, etc.
    new_partners_suggestions JSONB DEFAULT '[]', -- Karriereoffensive, etc.
    more_recommendations_suggestions JSONB DEFAULT '[]', -- Empfehlenswerter werden, etc.
    more_eh_suggestions JSONB DEFAULT '[]', -- bAV Check, etc.
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_applied BOOLEAN DEFAULT false,
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one recommendation per user per day per type
    UNIQUE(user_id, entry_date, recommendation_type)
);

-- Weekday Questions Configuration
CREATE TABLE IF NOT EXISTS weekday_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    weekday INTEGER CHECK (weekday >= 1 AND weekday <= 5), -- 1=Montag, 5=Freitag
    
    -- Fragen für "Was war gestern"
    yesterday_question TEXT,
    
    -- Fragen für "Zur heutigen Chance"
    today_questions JSONB DEFAULT '[]', -- Array von Fragen
    
    -- Trainee-spezifische Frage
    trainee_question TEXT DEFAULT 'Ein großer Test',
    
    -- Metadaten
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one configuration per weekday
    UNIQUE(weekday)
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date ON daily_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_week ON weekly_goals(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_team_data_team_date ON team_data(team_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_leader_week ON weekly_reviews(leader_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_date ON recommendations(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_weekday_questions_weekday ON weekday_questions(weekday);

-- Temporär RLS deaktivieren für Entwicklung
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekday_questions DISABLE ROW LEVEL SECURITY;

-- Insert default weekday questions
INSERT INTO weekday_questions (weekday, yesterday_question, today_questions, trainee_question) VALUES
(1, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Welche Beratungen sollen diese Woche durchgesprochen werden?"]', 'Ein großer Test'),
(2, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Welche Nacharbeiten stehen an?", "Bei welchen Nacharbeiten brauchst du Hilfe?", "Welchen Wettbewerb willst du gewinnen?"]', 'Ein großer Test'),
(3, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Wen meldest du für die TIV an?", "Wen meldest du für die TAA an?", "Wer fehlt noch aus deinem Umfeld?", "Wen darf deine FK heute für dich einladen?"]', 'Ein großer Test'),
(4, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Stehen bereits alle Termine für nächste Woche?", "Welche Firma möchte ich bezüglich bAV kontaktieren?"]', 'Ein großer Test'),
(5, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Nacharbeiten Checkbox für die Antwort aus Dienstag zum abhaken", "Worin hast du dich die Woche besonders verbessert?", "Welche Firma möchte ich bezüglich bAV kontaktieren?"]', 'Ein großer Test')
ON CONFLICT (weekday) DO NOTHING;
