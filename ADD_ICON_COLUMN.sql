-- Icon-Spalte zur Events-Tabelle hinzufügen
-- Führen Sie dieses Script in Ihrem Supabase SQL Editor aus

ALTER TABLE events ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '📅';

-- Standard-Icons für bestehende Events setzen
UPDATE events SET icon = '🎯' WHERE type = 'TIV';
UPDATE events SET icon = '📞' WHERE type = 'TAA';
UPDATE events SET icon = '⚡' WHERE type = 'Powermeeting';
UPDATE events SET icon = '👥' WHERE type = 'Direktionsmeeting';
UPDATE events SET icon = '📚' WHERE type = 'Schulung';
UPDATE events SET icon = '👥' WHERE type = 'Teammeeting';
UPDATE events SET icon = '📞' WHERE type = 'Telefonparty';
UPDATE events SET icon = '📅' WHERE icon IS NULL;
