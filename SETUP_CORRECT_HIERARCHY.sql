-- SETUP CORRECT HIERARCHY WITH REAL USER IDS
-- This script sets up the correct hierarchy: Marcel is under Philipp

-- 1. Show current state before setup
SELECT 'BEFORE HIERARCHY SETUP:' as status;
SELECT 
    id,
    firstname,
    lastname,
    name,
    role,
    team_name,
    parent_leader_id
FROM users 
ORDER BY role, name;

-- 2. Set up the correct hierarchy structure
-- Daniel (Admin) -> Philipp (Führungskraft) -> Marcel (Führungskraft)
-- Daniel (Admin) -> Kosta (Führungskraft) -> (future subordinates)
-- Robin Ache (Führungskraft) -> (future subordinates)

-- Set Philipp as subordinate of Daniel
UPDATE users 
SET parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49' 
WHERE id = 'e45ef1c8-0014-4035-b625-574bcf7b1a09';

-- Set Marcel as subordinate of Philipp
UPDATE users 
SET parent_leader_id = 'e45ef1c8-0014-4035-b625-574bcf7b1a09' 
WHERE id = 'a354807b-38c8-4a41-acbe-f93fcee40852';

-- Set Kosta as subordinate of Daniel
UPDATE users 
SET parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49' 
WHERE id = '303d4d0a-1d8d-42d9-b3c3-4d4a92e821ad';

-- Robin Ache remains independent (no parent_leader_id)

-- 3. Show the hierarchy after setup
SELECT 'AFTER HIERARCHY SETUP:' as status;
SELECT 
    u.id,
    u.firstname,
    u.lastname,
    u.name,
    u.role,
    u.team_name,
    u.parent_leader_id,
    p.name as parent_leader_name,
    CASE 
        WHEN u.parent_leader_id IS NULL THEN 'Top Level'
        ELSE 'Subordinate'
    END as hierarchy_level
FROM users u
LEFT JOIN users p ON u.parent_leader_id = p.id
ORDER BY 
    CASE WHEN u.parent_leader_id IS NULL THEN 0 ELSE 1 END,
    u.team_name,
    u.name;

-- 4. Test the hierarchy functions
SELECT 'TESTING HIERARCHY FUNCTIONS:' as status;

-- Test Daniel's subordinates (should show Philipp and Kosta)
SELECT 'Daniel''s subordinates:' as test;
SELECT * FROM get_user_subordinates('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- Test Philipp's subordinates (should show Marcel)
SELECT 'Philipp''s subordinates:' as test;
SELECT * FROM get_user_subordinates('e45ef1c8-0014-4035-b625-574bcf7b1a09');

-- Test Marcel's subordinates (should be empty for now)
SELECT 'Marcel''s subordinates:' as test;
SELECT * FROM get_user_subordinates('a354807b-38c8-4a41-acbe-f93fcee40852');

-- 5. Show the organizational structure
SELECT 'ORGANIZATIONAL STRUCTURE:' as status;
SELECT 
    u.name as leader_name,
    u.role,
    u.team_name,
    COUNT(s.id) as current_subordinates,
    STRING_AGG(s.name, ', ') as subordinate_names
FROM users u
LEFT JOIN users s ON s.parent_leader_id = u.id
GROUP BY u.id, u.name, u.role, u.team_name
ORDER BY u.team_name, u.name;

-- 6. Test the org structure function
SELECT 'TESTING ORG STRUCTURE FUNCTION:' as status;

-- Test Daniel's org structure (should show all)
SELECT 'Daniel''s org structure:' as test;
SELECT * FROM get_user_org_structure('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- Test Philipp's org structure (should show Philipp + Marcel)
SELECT 'Philipp''s org structure:' as test;
SELECT * FROM get_user_org_structure('e45ef1c8-0014-4035-b625-574bcf7b1a09');
