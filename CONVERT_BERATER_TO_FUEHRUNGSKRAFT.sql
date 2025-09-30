-- CONVERT ALL BERATER TO FUEHRUNGSKRAFT
-- This script removes the berater role and converts all berater to führungskraft
-- Everyone can now have subordinates, creating a fluid leadership structure

-- 1. Check current state
SELECT 'CURRENT STATE - User roles before conversion:' as status;
SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

SELECT 'CURRENT STATE - Users with berater role:' as status;
SELECT id, firstname, lastname, name, team_name, role FROM users WHERE role = 'berater' ORDER BY name;

-- 2. Update role constraint to remove berater
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'führungskraft', 'trainee'));

-- 3. Convert all berater to führungskraft
UPDATE users SET role = 'führungskraft' WHERE role = 'berater';

-- 4. Verify the conversion
SELECT 'AFTER CONVERSION - User roles:' as status;
SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

SELECT 'AFTER CONVERSION - All users:' as status;
SELECT id, firstname, lastname, name, team_name, role, parent_leader_id FROM users ORDER BY role, name;

-- 5. Update any existing logic that might reference 'berater' role
-- (This will be handled in the application code)

-- 6. Show the new hierarchy structure
SELECT 'NEW HIERARCHY STRUCTURE:' as status;
SELECT 
    u.id,
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

-- 7. Example: Show how everyone can now have subordinates
SELECT 'POTENTIAL SUBORDINATES FOR EACH USER:' as status;
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
