-- FIX HIERARCHY FUNCTION TYPES
-- This script fixes the type mismatch in the get_user_subordinates function

-- 1. Drop the existing function
DROP FUNCTION IF EXISTS get_user_subordinates(UUID);

-- 2. Recreate the function with correct types
CREATE OR REPLACE FUNCTION get_user_subordinates(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    firstname TEXT,
    lastname TEXT,
    name TEXT,
    team_name TEXT,
    role TEXT,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE subordinates AS (
        -- Base case: direct subordinates
        SELECT 
            u.id,
            u.firstname,
            u.lastname,
            u.name,
            u.team_name,
            u.role,
            1 as level
        FROM users u
        WHERE u.parent_leader_id = user_id_param
        
        UNION ALL
        
        -- Recursive case: subordinates of subordinates
        SELECT 
            u.id,
            u.firstname,
            u.lastname,
            u.name,
            u.team_name,
            u.role,
            s.level + 1
        FROM users u
        INNER JOIN subordinates s ON u.parent_leader_id = s.id
    )
    SELECT * FROM subordinates ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;

-- 3. Also fix the get_user_org_structure function
DROP FUNCTION IF EXISTS get_user_org_structure(UUID);

CREATE OR REPLACE FUNCTION get_user_org_structure(user_id_param UUID)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    team_name TEXT,
    role TEXT,
    parent_leader_id UUID,
    parent_leader_name TEXT,
    level INTEGER,
    is_leader BOOLEAN,
    subordinate_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH user_hierarchy AS (
        -- Get the user and their hierarchy
        SELECT 
            u.id as user_id,
            u.name as user_name,
            u.team_name,
            u.role,
            u.parent_leader_id,
            p.name as parent_leader_name,
            CASE 
                WHEN u.parent_leader_id IS NULL THEN 0
                ELSE 1
            END as level,
            u.is_team_leader as is_leader,
            (SELECT COUNT(*) FROM users s WHERE s.parent_leader_id = u.id) as subordinate_count
        FROM users u
        LEFT JOIN users p ON u.parent_leader_id = p.id
        WHERE u.id = user_id_param
        
        UNION ALL
        
        -- Get all subordinates
        SELECT 
            s.id as user_id,
            s.name as user_name,
            s.team_name,
            s.role,
            s.parent_leader_id,
            u.name as parent_leader_name,
            uh.level + 1 as level,
            s.is_team_leader as is_leader,
            (SELECT COUNT(*) FROM users ss WHERE ss.parent_leader_id = s.id) as subordinate_count
        FROM users s
        INNER JOIN user_hierarchy uh ON s.parent_leader_id = uh.user_id
    )
    SELECT * FROM user_hierarchy ORDER BY level, user_name;
END;
$$ LANGUAGE plpgsql;

-- 4. Test the fixed functions
SELECT 'TESTING FIXED HIERARCHY FUNCTIONS:' as status;

-- Test Daniel's subordinates
SELECT 'Daniel''s subordinates:' as test;
SELECT * FROM get_user_subordinates('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- Test Philipp's subordinates
SELECT 'Philipp''s subordinates:' as test;
SELECT * FROM get_user_subordinates('e45ef1c8-0014-4035-b625-574bcf7b1a09');

-- Test Marcel's subordinates
SELECT 'Marcel''s subordinates:' as test;
SELECT * FROM get_user_subordinates('a354807b-38c8-4a41-acbe-f93fcee40852');

-- 5. Test the org structure function
SELECT 'TESTING ORG STRUCTURE FUNCTION:' as status;

-- Test Daniel's org structure
SELECT 'Daniel''s org structure:' as test;
SELECT * FROM get_user_org_structure('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- Test Philipp's org structure
SELECT 'Philipp''s org structure:' as test;
SELECT * FROM get_user_org_structure('e45ef1c8-0014-4035-b625-574bcf7b1a09');
