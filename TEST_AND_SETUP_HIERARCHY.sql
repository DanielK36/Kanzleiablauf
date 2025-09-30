-- TEST AND SETUP HIERARCHY
-- This script tests the hierarchy functions and sets up initial structure

-- 1. Test the get_user_subordinates function
SELECT 'TESTING get_user_subordinates FUNCTION:' as status;

-- Test with Daniel (should return all subordinates)
SELECT 'Daniel''s subordinates:' as test;
SELECT * FROM get_user_subordinates('daniel_user_id_here');

-- Test with Marcel (should return Lorenz if he exists)
SELECT 'Marcel''s subordinates:' as test;
SELECT * FROM get_user_subordinates('marcel_user_id_here');

-- 2. Test the get_user_org_structure function
SELECT 'TESTING get_user_org_structure FUNCTION:' as status;

-- Test with Daniel
SELECT 'Daniel''s org structure:' as test;
SELECT * FROM get_user_org_structure('daniel_user_id_here');

-- 3. Show current users and their hierarchy
SELECT 'CURRENT USERS AND HIERARCHY:' as status;
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

-- 4. Set up example hierarchy (uncomment and modify with actual user IDs)
/*
-- Example hierarchy setup:
-- Daniel (Admin) -> Marcel (Führungskraft) -> Lorenz (Führungskraft)
-- Daniel (Admin) -> Philipp (Führungskraft) -> Kosta (Führungskraft)

-- First, get the actual user IDs
SELECT 'ACTUAL USER IDS FOR HIERARCHY SETUP:' as status;
SELECT id, firstname, lastname, name, role, team_name FROM users ORDER BY name;

-- Then set up the hierarchy (replace with actual IDs from above query)
-- Set Marcel's parent to Daniel
-- UPDATE users SET parent_leader_id = 'daniel_actual_id' WHERE firstname = 'Marcel';

-- Set Philipp's parent to Daniel  
-- UPDATE users SET parent_leader_id = 'daniel_actual_id' WHERE firstname = 'Philipp';

-- Set Lorenz's parent to Marcel
-- UPDATE users SET parent_leader_id = 'marcel_actual_id' WHERE firstname = 'Lorenz';

-- Set Kosta's parent to Philipp
-- UPDATE users SET parent_leader_id = 'philipp_actual_id' WHERE firstname = 'Kosta';
*/

-- 5. Show potential hierarchy after setup
SELECT 'POTENTIAL HIERARCHY STRUCTURE:' as status;
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
