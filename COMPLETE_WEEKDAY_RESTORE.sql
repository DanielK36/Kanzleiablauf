-- COMPLETE WEEKDAY QUESTIONS RESTORE - Alle Wochentags-Fragen korrekt wiederherstellen
-- Diese SQL stellt ALLE Wochentags-Fragen mit der richtigen Struktur wieder her

-- 1. Zeige aktuelle Situation
SELECT 'CURRENT STATE - All weekday questions:' as status;
SELECT id, weekday, yesterday_question, today_questions, trainee_question FROM weekday_questions ORDER BY weekday;

-- 2. Lösche ALLE bestehenden Wochentags-Fragen (kompletter Reset)
DELETE FROM weekday_questions;

-- 3. Erstelle ALLE Wochentags-Fragen mit der korrekten Struktur
INSERT INTO weekday_questions (weekday, yesterday_question, today_questions, trainee_question, created_at, updated_at) VALUES
-- Montag (1)
(1, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Welche Beratungen sollen diese Woche durchgesprochen werden?"]', 
 'Ein großer Test', NOW(), NOW()),

-- Dienstag (2)
(2, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Welche Nacharbeiten stehen an?", "Bei welchen Nacharbeiten brauchst du Hilfe?", "Welchen Wettbewerb willst du gewinnen?"]', 
 'Ein großer Test', NOW(), NOW()),

-- Mittwoch (3)
(3, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Wen meldest du für die TIV an?", "Wen meldest du für die TAA an?", "Wer fehlt noch aus deinem Umfeld?", "Wen darf deine FK heute für dich einladen?"]', 
 'Ein großer Test', NOW(), NOW()),

-- Donnerstag (4)
(4, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Stehen bereits alle Termine für nächste Woche?", "Welche Firma möchte ich bezüglich bAV kontaktieren?"]', 
 'Ein großer Test', NOW(), NOW()),

-- Freitag (5)
(5, 'Was sind deine drei Diamanten von den Samstagsschulungen?', 
 '["Welche Firma möchte ich bezüglich bAV kontaktieren?"]', 
 'Ein großer Test', NOW(), NOW());

-- 4. Zeige wiederhergestellte Wochentags-Fragen
SELECT 'RESTORED WEEKDAY QUESTIONS:' as status;
SELECT weekday, yesterday_question, today_questions, trainee_question FROM weekday_questions ORDER BY weekday;

-- 5. Zeige alle Wochentags-Fragen zur Bestätigung
SELECT 'FINAL STATE - All weekday questions:' as status;
SELECT 
  CASE weekday 
    WHEN 1 THEN 'Montag'
    WHEN 2 THEN 'Dienstag' 
    WHEN 3 THEN 'Mittwoch'
    WHEN 4 THEN 'Donnerstag'
    WHEN 5 THEN 'Freitag'
  END as wochentag,
  yesterday_question,
  today_questions,
  trainee_question
FROM weekday_questions ORDER BY weekday;
