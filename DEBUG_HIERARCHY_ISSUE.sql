-- DEBUG HIERARCHY ISSUE
-- This script debugs why the hierarchy functions are not showing all users

-- 1. Show current hierarchy state
SELECT 'CURRENT HIERARCHY STATE:' as status;
SELECT 
    u.id,
    u.firstname,
    u.lastname,
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

-- 2. Test the get_user_subordinates function for Daniel
SELECT 'TESTING get_user_subordinates FOR DANIEL:' as status;
SELECT * FROM get_user_subordinates('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- 3. Test the get_user_org_structure function for Daniel
SELECT 'TESTING get_user_org_structure FOR DANIEL:' as status;
SELECT * FROM get_user_org_structure('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- 4. Manual test: Check if all users have the correct parent_leader_id
SELECT 'MANUAL TEST - ALL USERS WITH PARENT_LEADER_ID:' as status;
SELECT 
    id,
    name,
    parent_leader_id,
    CASE 
        WHEN parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49' THEN 'Under Daniel'
        WHEN parent_leader_id = 'e45ef1c8-0014-4035-b625-574bcf7b1a09' THEN 'Under Philipp'
        WHEN parent_leader_id IS NULL THEN 'Top Level'
        ELSE 'Other'
    END as hierarchy_status
FROM users 
WHERE parent_leader_id IS NOT NULL OR id = '502e90ae-3557-48d1-8028-408fe9ee2c49'
ORDER BY hierarchy_status, name;

-- 5. Check if the issue is with the function logic
SELECT 'CHECKING FUNCTION LOGIC:' as status;
SELECT 
    'Daniel should see:' as expected,
    COUNT(*) as count
FROM users 
WHERE parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49' 
   OR id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- 6. Test a simple query to see all Daniel's subordinates
SELECT 'SIMPLE QUERY - DANIEL''S SUBORDINATES:' as status;
SELECT 
    u.id,
    u.name,
    u.role,
    u.team_name
FROM users u
WHERE u.parent_leader_id = '502e90ae-3557-48d1-8028-408fe9ee2c49'
ORDER BY u.name;
