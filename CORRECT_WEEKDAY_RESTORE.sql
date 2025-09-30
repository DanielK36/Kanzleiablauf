-- CORRECT WEEKDAY RESTORE - Restores the ACTUAL current weekday questions
-- This script ensures all weekday questions are correctly configured with the REAL questions

-- 1. Delete all existing weekday questions
DELETE FROM weekday_questions;

-- 2. Insert ACTUAL weekday questions for all 5 weekdays
INSERT INTO weekday_questions (weekday, yesterday_question, today_questions, trainee_question) VALUES
(1, 'Was sind deine drei Diamanten von den Samstagsschulungen?',
 '["Welche Beratungen sollen diese Woche durchgesprochen werden?"]', 'Wie viel % hattest du im großen Test gestern?'),

(2, 'Worin hast du dich letzte Woche verbessert?',
 '["Welche Nacharbeiten stehen an?", "Bei welchen Nacharbeiten brauchst du Hilfe?", "Welchen Wettbewerb willst du gewinnen?"]', 'Wie viel % hattest du im großen Test gestern?'),

(3, 'Worin hast du dich letzte Woche verbessert?',
 '["Wen meldest du für die TIV an?", "Wen meldest du für die TAA an?", "Wer fehlt aus deinem Umfeld verdient noch eine Chance?", "Wen darf deine FK heute für dich einladen?"]', 'Wie viel % hattest du im großen Test gestern?'),

(4, 'Worin hast du dich letzte Woche verbessert?',
 '["Stehen bereits alle Termine für nächste Woche?"]', 'Wie viel % hattest du im großen Test gestern?'),

(5, 'Worin hast du dich diese Woche verbessert?',
 '["Welche Firma möchtest du bezüglich bAV kontaktieren?"]', 'Wie viel % hattest du im großen Test gestern?');

-- 3. Verify the result
SELECT 'FINAL STATE - All Weekday Questions:' as status;
SELECT weekday, yesterday_question, today_questions, trainee_question FROM weekday_questions ORDER BY weekday;
