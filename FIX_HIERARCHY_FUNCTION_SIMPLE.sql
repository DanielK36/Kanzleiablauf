-- FIX HIERARCHY FUNCTION SIMPLE VERSION
-- This script creates simple working hierarchy functions

-- 1. Check the actual column types in the users table
SELECT 'ACTUAL COLUMN TYPES IN USERS TABLE:' as status;
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'firstname', 'lastname', 'name', 'team_name', 'role', 'parent_leader_id', 'is_team_leader')
ORDER BY column_name;

-- 2. Drop the existing functions
DROP FUNCTION IF EXISTS get_user_subordinates(UUID);
DROP FUNCTION IF EXISTS get_user_org_structure(UUID);

-- 3. Create a simple working function for subordinates
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
            u.firstname::TEXT,
            u.lastname::TEXT,
            u.name::TEXT,
            u.team_name::TEXT,
            u.role::TEXT,
            1 as level
        FROM users u
        WHERE u.parent_leader_id = user_id_param
        
        UNION ALL
        
        -- Recursive case: subordinates of subordinates
        SELECT 
            u.id,
            u.firstname::TEXT,
            u.lastname::TEXT,
            u.name::TEXT,
            u.team_name::TEXT,
            u.role::TEXT,
            s.level + 1
        FROM users u
        INNER JOIN subordinates s ON u.parent_leader_id = s.id
    )
    SELECT * FROM subordinates ORDER BY level, name;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a simpler org structure function
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
    WITH RECURSIVE org_structure AS (
        -- Base case: the user themselves
        SELECT 
            u.id as user_id,
            u.name::TEXT as user_name,
            u.team_name::TEXT,
            u.role::TEXT,
            u.parent_leader_id,
            p.name::TEXT as parent_leader_name,
            0 as level,
            u.is_team_leader as is_leader,
            (SELECT COUNT(*) FROM users s WHERE s.parent_leader_id = u.id) as subordinate_count
        FROM users u
        LEFT JOIN users p ON u.parent_leader_id = p.id
        WHERE u.id = user_id_param
        
        UNION ALL
        
        -- Recursive case: all subordinates
        SELECT 
            s.id as user_id,
            s.name::TEXT as user_name,
            s.team_name::TEXT,
            s.role::TEXT,
            s.parent_leader_id,
            p2.name::TEXT as parent_leader_name,
            os.level + 1 as level,
            s.is_team_leader as is_leader,
            (SELECT COUNT(*) FROM users ss WHERE ss.parent_leader_id = s.id) as subordinate_count
        FROM users s
        INNER JOIN org_structure os ON s.parent_leader_id = os.user_id
        LEFT JOIN users p2 ON s.parent_leader_id = p2.id
    )
    SELECT * FROM org_structure ORDER BY level, user_name;
END;
$$ LANGUAGE plpgsql;

-- 5. Test the fixed functions
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

-- 6. Test the org structure function
SELECT 'TESTING ORG STRUCTURE FUNCTION:' as status;

-- Test Daniel's org structure
SELECT 'Daniel''s org structure:' as test;
SELECT * FROM get_user_org_structure('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- Test Philipp's org structure
SELECT 'Philipp''s org structure:' as test;
SELECT * FROM get_user_org_structure('e45ef1c8-0014-4035-b625-574bcf7b1a09');
