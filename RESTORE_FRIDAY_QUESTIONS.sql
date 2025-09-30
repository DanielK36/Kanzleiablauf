-- RESTORE FRIDAY QUESTIONS - Wiederherstellung der Freitags-Fragen
-- Diese SQL stellt die Standard-Freitags-Fragen wieder her

-- 1. Zeige aktuelle Freitags-Fragen
SELECT 'CURRENT FRIDAY QUESTIONS:' as status;
SELECT id, weekday, yesterday_question, today_questions, trainee_question FROM weekday_questions WHERE weekday = 5;

-- 2. Lösche eventuelle leere Freitags-Einträge
DELETE FROM weekday_questions WHERE weekday = 5;

-- 3. Erstelle Standard-Freitags-Fragen
INSERT INTO weekday_questions (
  weekday, 
  yesterday_question, 
  today_questions, 
  trainee_question,
  created_at,
  updated_at
) VALUES (
  5, -- Freitag
  'Was sind deine drei Diamanten von den Samstagsschulungen?',
  '["Welche Firma möchte ich bezüglich bAV kontaktieren?"]',
  'Ein großer Test',
  NOW(),
  NOW()
);

-- 4. Zeige wiederhergestellte Freitags-Fragen
SELECT 'RESTORED FRIDAY QUESTIONS:' as status;
SELECT id, weekday, yesterday_question, today_questions, trainee_question FROM weekday_questions WHERE weekday = 5;

-- 5. Zeige alle Wochentags-Fragen
SELECT 'ALL WEEKDAY QUESTIONS:' as status;
SELECT weekday, yesterday_question, today_questions, trainee_question FROM weekday_questions ORDER BY weekday;
