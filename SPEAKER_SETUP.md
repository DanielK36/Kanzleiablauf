# 🎤 Speaker Management System - Setup

## 📋 Datenbank-Tabellen erstellen

Das Speaker Management System benötigt zwei neue Tabellen. Führe diese SQL-Befehle in deiner Supabase-Konsole aus:

### 1. Speaker Bookings Tabelle

```sql
-- Speaker Bookings Table
CREATE TABLE speaker_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,
    event_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, event_date) -- Only one speaker per event per date
);

-- Indexes for better performance
CREATE INDEX idx_speaker_bookings_event_id ON speaker_bookings(event_id);
CREATE INDEX idx_speaker_bookings_speaker_id ON speaker_bookings(speaker_id);
CREATE INDEX idx_speaker_bookings_event_date ON speaker_bookings(event_date);
CREATE INDEX idx_speaker_bookings_status ON speaker_bookings(status);

-- Row Level Security
ALTER TABLE speaker_bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Speakers can view their own bookings
CREATE POLICY "Speakers can view own bookings" ON speaker_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM speakers
            WHERE speakers.id = speaker_bookings.speaker_id
            AND speakers.email = auth.jwt() ->> 'sub'
        )
    );

-- Policy: Speakers can create their own bookings
CREATE POLICY "Speakers can create own bookings" ON speaker_bookings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM speakers
            WHERE speakers.id = speaker_bookings.speaker_id
            AND speakers.email = auth.jwt() ->> 'sub'
        )
    );

-- Policy: Speakers can update their own bookings
CREATE POLICY "Speakers can update own bookings" ON speaker_bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM speakers
            WHERE speakers.id = speaker_bookings.speaker_id
            AND speakers.email = auth.jwt() ->> 'sub'
        )
    );

-- Policy: Speakers can delete their own bookings
CREATE POLICY "Speakers can delete own bookings" ON speaker_bookings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM speakers
            WHERE speakers.id = speaker_bookings.speaker_id
            AND speakers.email = auth.jwt() ->> 'sub'
        )
    );

-- Policy: Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON speaker_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

-- Policy: Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings" ON speaker_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_speaker_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_speaker_bookings_updated_at
    BEFORE UPDATE ON speaker_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_speaker_bookings_updated_at();
```

### 2. Push Subscriptions Tabelle

```sql
-- Push Subscriptions Table
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    subscription JSONB NOT NULL, -- Push subscription object
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Indexes for better performance
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
    FOR ALL USING (
        user_id = auth.jwt() ->> 'sub'
    );

-- Policy: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON push_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_push_subscriptions_updated_at
    BEFORE UPDATE ON push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_push_subscriptions_updated_at();
```

## 🚀 Nach der Erstellung

Nach dem Ausführen der SQL-Befehle:

1. **Speaker Dashboard** (`/speaker-dashboard`) wird funktionsfähig
2. **Buchungsfunktion** für wiederkehrende Veranstaltungen aktiv
3. **Push-Benachrichtigungen** für neue Termine verfügbar
4. **Admin-Management** für Speaker-Buchungen möglich

## 📱 Features

- ✅ **Wochenansicht** für wiederkehrende Veranstaltungen
- ✅ **Live-Buchungen** mit sofortiger Verfügbarkeits-Anzeige
- ✅ **Push-Benachrichtigungen** bei neuen Terminen
- ✅ **Mobile-optimiert** für Smartphone-Nutzung
- ✅ **Admin-Übersicht** aller Buchungen

## 🔧 Troubleshooting

Falls Probleme auftreten:
1. Prüfe die Supabase-Konsole auf Fehler
2. Stelle sicher, dass die `events` und `speakers` Tabellen existieren
3. Überprüfe die Row Level Security Policies
4. Teste die APIs über `/api/test-tables`
