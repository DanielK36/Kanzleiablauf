-- TEST HIERARCHY WITH REAL USER IDS
-- This script gets real user IDs first, then tests the hierarchy functions

-- 1. Get all current users with their IDs
SELECT 'CURRENT USERS WITH IDS:' as status;
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

-- 2. Test the get_user_subordinates function with real IDs
-- First, let's test with a user who might have subordinates
SELECT 'TESTING get_user_subordinates FUNCTION:' as status;

-- Test with the first user (replace with actual ID from above)
-- SELECT 'Testing with first user:' as test;
-- SELECT * FROM get_user_subordinates('ACTUAL_USER_ID_HERE');

-- 3. Test the get_user_org_structure function
SELECT 'TESTING get_user_org_structure FUNCTION:' as status;

-- Test with the first user (replace with actual ID from above)
-- SELECT 'Testing org structure with first user:' as test;
-- SELECT * FROM get_user_org_structure('ACTUAL_USER_ID_HERE');

-- 4. Show current hierarchy structure
SELECT 'CURRENT HIERARCHY STRUCTURE:' as status;
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

-- 5. Show potential subordinates for each user
SELECT 'POTENTIAL SUBORDINATES FOR EACH USER:' as status;
SELECT 
    u.id,
    u.name as leader_name,
    u.role,
    u.team_name,
    COUNT(s.id) as current_subordinates,
    STRING_AGG(s.name, ', ') as subordinate_names
FROM users u
LEFT JOIN users s ON s.parent_leader_id = u.id
GROUP BY u.id, u.name, u.role, u.team_name
ORDER BY u.team_name, u.name;

-- 6. Example: Set up a simple hierarchy
-- Uncomment and modify with actual IDs from step 1
/*
-- Example: Set up a simple hierarchy
-- Replace 'USER_ID_1', 'USER_ID_2', etc. with actual IDs from step 1

-- Set user 2 as subordinate of user 1
-- UPDATE users SET parent_leader_id = 'USER_ID_1' WHERE id = 'USER_ID_2';

-- Set user 3 as subordinate of user 2
-- UPDATE users SET parent_leader_id = 'USER_ID_2' WHERE id = 'USER_ID_3';

-- Then test the hierarchy functions with real IDs
-- SELECT * FROM get_user_subordinates('USER_ID_1');
-- SELECT * FROM get_user_org_structure('USER_ID_1');
*/
