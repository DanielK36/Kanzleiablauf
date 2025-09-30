-- FIX ORG STRUCTURE FUNCTION
-- This script fixes the get_user_org_structure function to show the user themselves

-- 1. Drop and recreate the org structure function
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
    subordinate_count BIGINT
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

-- 2. Test the fixed function
SELECT 'TESTING FIXED ORG STRUCTURE FUNCTION:' as status;

-- Test Daniel's org structure (should show Daniel + all subordinates)
SELECT 'Daniel''s org structure:' as test;
SELECT * FROM get_user_org_structure('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- Test Philipp's org structure (should show Philipp + Marcel)
SELECT 'Philipp''s org structure:' as test;
SELECT * FROM get_user_org_structure('e45ef1c8-0014-4035-b625-574bcf7b1a09');

-- Test Marcel's org structure (should show only Marcel)
SELECT 'Marcel''s org structure:' as test;
SELECT * FROM get_user_org_structure('a354807b-38c8-4a41-acbe-f93fcee40852');

-- 3. Also test the subordinates function
SELECT 'TESTING SUBORDINATES FUNCTION:' as status;

-- Test Daniel's subordinates (should show Philipp, Kosta, Robin)
SELECT 'Daniel''s subordinates:' as test;
SELECT * FROM get_user_subordinates('502e90ae-3557-48d1-8028-408fe9ee2c49');

-- Test Philipp's subordinates (should show Marcel)
SELECT 'Philipp''s subordinates:' as test;
SELECT * FROM get_user_subordinates('e45ef1c8-0014-4035-b625-574bcf7b1a09');
