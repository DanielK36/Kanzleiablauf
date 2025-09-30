-- SAFE ROLE FIX - Checks current roles first, then fixes them
-- This script safely fixes roles without breaking existing data

-- 1. First, let's see what we currently have
SELECT 'CURRENT STATE - All user roles:' as status;
SELECT DISTINCT role FROM users ORDER BY role;

SELECT 'CURRENT STATE - Users with their roles:' as status;
SELECT id, email, firstname, lastname, name, role, team_name FROM users ORDER BY role, name;

-- 2. Check if there are any invalid roles that would break the constraint
SELECT 'INVALID ROLES CHECK:' as status;
SELECT role, COUNT(*) as count 
FROM users 
WHERE role NOT IN ('admin', 'top_leader', 'sub_leader', 'trainee', 'advisor')
GROUP BY role;

-- 3. Drop existing constraint safely
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 4. Update any invalid roles to valid ones BEFORE adding constraint
-- Map any unknown roles to 'advisor' as default
UPDATE users SET role = 'advisor' WHERE role NOT IN ('admin', 'top_leader', 'sub_leader', 'trainee', 'advisor');

-- 5. Now add the constraint with the current valid roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'top_leader', 'sub_leader', 'trainee', 'advisor'));

-- 6. Verify the constraint works
SELECT 'CONSTRAINT TEST - All roles should be valid now:' as status;
SELECT DISTINCT role FROM users ORDER BY role;

-- 7. Show final state
SELECT 'FINAL STATE - All users with corrected roles:' as status;
SELECT id, email, firstname, lastname, name, role, team_name FROM users ORDER BY role, name;

-- Success message
SELECT 'Role constraint fixed safely!' as status;
