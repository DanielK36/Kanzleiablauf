-- DEBUG SUBORDINATES FUNCTION
-- This script debugs why the get_user_subordinates function is not showing all users

-- 1. Check the current hierarchy state
SELECT 'CURRENT HIERARCHY STATE:' as status;
SELECT 
    u.id,
    u.name,
    u.role,
    u.team_name,
    u.parent_leader_id,
    p.name as parent_leader_name
FROM users u
LEFT JOIN users p ON u.parent_leader_id = p.id
ORDER BY 
    CASE WHEN u.parent_leader_id IS NULL THEN 0 ELSE 1 END,
    u.team_name,
    u.name;

-- 2. Manual test: Check all users under Daniel
SELECT 'MANUAL TEST - ALL USERS UNDER DANIEL:' as status;
SELECT 
    id,
    name,
    role,
    team_name,
    parent_leader_id
FROM users 
WHERE parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49'
ORDER BY name;

-- 3. Check if the issue is with the function logic
SELECT 'CHECKING FUNCTION LOGIC:' as status;
SELECT 
    'Daniel should see these direct subordinates:' as expected,
    COUNT(*) as count
FROM users 
WHERE parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- 4. Test the function step by step
SELECT 'TESTING FUNCTION STEP BY STEP:' as status;

-- Base case: direct subordinates
SELECT 'Base case - direct subordinates:' as test;
SELECT 
    u.id,
    u.firstname,
    u.lastname,
    u.name,
    u.team_name,
    u.role,
    1 as level
FROM users u
WHERE u.parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- 5. Check if there's an issue with the recursive part
SELECT 'CHECKING RECURSIVE PART:' as status;
SELECT 
    'Users under Philipp:' as test,
    COUNT(*) as count
FROM users 
WHERE parent_leader_id = 'e45ef1c8-0014-4035-b625-574bcf7b1a09';

-- 6. Test the function with a simpler approach
SELECT 'TESTING SIMPLER APPROACH:' as status;
SELECT 
    u.id,
    u.firstname,
    u.lastname,
    u.name,
    u.team_name,
    u.role,
    1 as level
FROM users u
WHERE u.parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49'
UNION ALL
SELECT 
    u.id,
    u.firstname,
    u.lastname,
    u.name,
    u.team_name,
    u.role,
    2 as level
FROM users u
WHERE u.parent_leader_id IN (
    SELECT id FROM users WHERE parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49'
)
ORDER BY level, name;
