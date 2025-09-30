-- FIX ROLE CONSTRAINT ERROR
-- This script fixes the constraint error by first converting all berater to führungskraft
-- and then updating the constraint

-- 1. Check current state
SELECT 'CURRENT STATE - User roles before fix:' as status;
SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

-- 2. First, convert all berater to führungskraft
UPDATE users SET role = 'führungskraft' WHERE role = 'berater';

-- 3. Verify the conversion
SELECT 'AFTER CONVERSION - User roles:' as status;
SELECT DISTINCT role, COUNT(*) as count FROM users GROUP BY role ORDER BY role;

-- 4. Now update the constraint (this should work now)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'führungskraft', 'trainee'));

-- 5. Verify the constraint is working
SELECT 'CONSTRAINT TEST - All current roles:' as status;
SELECT DISTINCT role FROM users ORDER BY role;

-- 6. Show final state
SELECT 'FINAL STATE - All users with their roles:' as status;
SELECT id, firstname, lastname, name, team_name, role, parent_leader_id FROM users ORDER BY role, name;
