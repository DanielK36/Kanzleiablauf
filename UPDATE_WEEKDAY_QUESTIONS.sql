-- UPDATE WEEKDAY QUESTIONS - Korrigiere alle Wochentags-Fragen mit den richtigen Fragen
-- Diese SQL aktualisiert die weekday_questions Tabelle mit den korrekten Fragen

-- 1. Zeige aktuelle Situation
SELECT 'CURRENT STATE - All weekday questions:' as status;
SELECT id, weekday, yesterday_question, today_questions, trainee_question FROM weekday_questions ORDER BY weekday;

-- 2. Lösche ALLE bestehenden Wochentags-Fragen (kompletter Reset)
DELETE FROM weekday_questions;

-- 3. Erstelle ALLE Wochentags-Fragen mit der korrekten Struktur
INSERT INTO weekday_questions (weekday, yesterday_question, today_questions, trainee_question, created_at, updated_at) VALUES
-- Montag (1)
(1, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Wobei brauchst du heute Hilfe?", "Was willst du heute trainieren?", "Was willst du heute noch besser machen?", "Welche Beratungen sollen diese Woche durchgesprochen werden?"]', 
 'Ein großer Test', NOW(), NOW()),

-- Dienstag (2)
(2, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Wobei brauchst du heute Hilfe?", "Was willst du heute trainieren?", "Was willst du heute noch besser machen?", "Welche Beratungen sollen diese Woche durchgesprochen werden?"]', 
 'Ein großer Test', NOW(), NOW()),

-- Mittwoch (3)
(3, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Wobei brauchst du heute Hilfe?", "Was willst du heute trainieren?", "Was willst du heute noch besser machen?", "Welche Beratungen sollen diese Woche durchgesprochen werden?"]', 
 'Ein großer Test', NOW(), NOW()),

-- Donnerstag (4)
(4, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Wobei brauchst du heute Hilfe?", "Was willst du heute trainieren?", "Was willst du heute noch besser machen?", "Welche Beratungen sollen diese Woche durchgesprochen werden?"]', 
 'Ein großer Test', NOW(), NOW()),

-- Freitag (5)
(5, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Wobei brauchst du heute Hilfe?", "Was willst du heute trainieren?", "Was willst du heute noch besser machen?", "Welche Beratungen sollen diese Woche durchgesprochen werden?"]', 
 'Ein großer Test', NOW(), NOW());

-- 4. Zeige aktualisierte Wochentags-Fragen
SELECT 'UPDATED WEEKDAY QUESTIONS:' as status;
SELECT weekday, yesterday_question, today_questions, trainee_question FROM weekday_questions ORDER BY weekday;

