-- Robin Ache team_id Problem beheben
-- Robin hat team_id: null, was 500 Fehler verursacht

-- 1. Zuerst schauen wir, welche Teams verfügbar sind
SELECT id, name FROM teams ORDER BY name;

-- 2. Robin Ache eine team_id zuweisen
-- Da er "Goalgetter" als team_name hat, nehmen wir an, dass es ein Team mit diesem Namen gibt
-- Falls nicht, erstellen wir ein neues Team oder weisen ihm ein existierendes zu

-- Option A: Falls "Goalgetter" Team existiert
UPDATE users 
SET team_id = (
  SELECT id FROM teams WHERE name = 'Goalgetter' LIMIT 1
)
WHERE clerk_id = 'user_3368hwBunFTQBGuqgU8gNH7Mv7N';

-- Option B: Falls "Goalgetter" Team nicht existiert, erstellen wir es
INSERT INTO teams (name, description, created_at, updated_at)
SELECT 'Goalgetter', 'Goalgetter Team', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM teams WHERE name = 'Goalgetter');

-- Dann Robin diesem Team zuweisen
UPDATE users 
SET team_id = (
  SELECT id FROM teams WHERE name = 'Goalgetter' LIMIT 1
)
WHERE clerk_id = 'user_3368hwBunFTQBGuqgU8gNH7Mv7N';

-- 3. Überprüfung: Robin's aktualisierte Daten
SELECT 
  id, 
  clerk_id, 
  name, 
  role, 
  team_id, 
  team_name,
  firstname,
  lastname
FROM users 
WHERE clerk_id = 'user_3368hwBunFTQBGuqgU8gNH7Mv7N';

-- 4. Alle Teams anzeigen
SELECT id, name, description FROM teams ORDER BY name;

