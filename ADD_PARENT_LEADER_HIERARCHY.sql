-- ADD PARENT LEADER HIERARCHY SYSTEM
-- This script adds parent_leader_id field to users table for organizational hierarchy

-- 1. Add parent_leader_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_leader_id UUID REFERENCES users(id);

-- 2. Add index for better performance on hierarchy queries
CREATE INDEX IF NOT EXISTS idx_users_parent_leader_id ON users(parent_leader_id);

-- 3. Add index for team_id + parent_leader_id combination
CREATE INDEX IF NOT EXISTS idx_users_team_parent ON users(team_id, parent_leader_id);

-- 4. Create function to get all subordinates of a user (recursive)
CREATE OR REPLACE FUNCTION get_user_subordinates(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    firstname VARCHAR,
    lastname VARCHAR,
    name VARCHAR,
    team_name VARCHAR,
    role VARCHAR,
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

-- 5. Create function to get organizational structure for a user
CREATE OR REPLACE FUNCTION get_user_org_structure(user_id_param UUID)
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR,
    team_name VARCHAR,
    role VARCHAR,
    parent_leader_id UUID,
    parent_leader_name VARCHAR,
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

-- 6. Show current users and their potential hierarchy
SELECT 'CURRENT USERS FOR HIERARCHY SETUP:' as status;
SELECT 
    id,
    firstname,
    lastname,
    name,
    team_name,
    role,
    is_team_leader,
    parent_leader_id
FROM users 
ORDER BY team_name, role, name;

-- 7. Example: Set up initial hierarchy (adjust based on your actual structure)
-- Uncomment and modify these lines based on your actual user IDs and desired hierarchy

/*
-- Example hierarchy setup:
-- Daniel (Admin) -> Marcel (Führungskraft) -> Lorenz (Berater)
-- Daniel (Admin) -> Philipp (Führungskraft) -> Kosta (Berater)

-- Set Marcel's parent to Daniel
UPDATE users SET parent_leader_id = 'daniel_user_id_here' WHERE firstname = 'Marcel';

-- Set Philipp's parent to Daniel  
UPDATE users SET parent_leader_id = 'daniel_user_id_here' WHERE firstname = 'Philipp';

-- Set Lorenz's parent to Marcel
UPDATE users SET parent_leader_id = 'marcel_user_id_here' WHERE firstname = 'Lorenz';

-- Set Kosta's parent to Philipp
UPDATE users SET parent_leader_id = 'philipp_user_id_here' WHERE firstname = 'Kosta';
*/

-- 8. Test the hierarchy functions
SELECT 'TESTING HIERARCHY FUNCTIONS:' as status;

-- Test getting subordinates (replace with actual user ID)
-- SELECT * FROM get_user_subordinates('user_id_here');

-- Test getting org structure (replace with actual user ID)  
-- SELECT * FROM get_user_org_structure('user_id_here');
