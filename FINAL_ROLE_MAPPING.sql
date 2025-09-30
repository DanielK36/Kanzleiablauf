-- FINAL ROLE MAPPING - Maps current roles to desired structure
-- This script maps the existing roles to the correct structure

-- 1. Check current state after constraint fix
SELECT 'CURRENT STATE - All user roles:' as status;
SELECT DISTINCT role FROM users ORDER BY role;

SELECT 'CURRENT STATE - Users with their roles:' as status;
SELECT id, email, firstname, lastname, name, role, team_name FROM users ORDER BY role, name;

-- 2. Drop the current constraint to allow role changes
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. Map existing roles to the correct structure
-- Map old roles to new structure
UPDATE users SET role = 'führungskraft' WHERE role IN ('top_leader', 'sub_leader');
UPDATE users SET role = 'berater' WHERE role = 'advisor';

-- 4. Add the new constraint with correct roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'führungskraft', 'berater', 'trainee'));

-- 5. Add team leader columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_leader_for UUID REFERENCES teams(id);

-- 6. Create function to set team leader
CREATE OR REPLACE FUNCTION set_team_leader(team_id_param UUID, user_id_param UUID)
RETURNS VOID AS $$
BEGIN
    -- Remove existing team leader for this team
    UPDATE users 
    SET is_team_leader = FALSE, team_leader_for = NULL 
    WHERE team_leader_for = team_id_param;
    
    -- Set new team leader
    UPDATE users 
    SET is_team_leader = TRUE, team_leader_for = team_id_param 
    WHERE id = user_id_param;
    
    -- Update user role to führungskraft if not admin
    UPDATE users 
    SET role = 'führungskraft' 
    WHERE id = user_id_param AND role != 'admin';
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get team analytics
CREATE OR REPLACE FUNCTION get_team_analytics(team_id_param UUID)
RETURNS TABLE (
    team_id UUID,
    team_name VARCHAR,
    team_level INTEGER,
    total_members BIGINT,
    team_leaders BIGINT,
    berater_count BIGINT,
    trainee_count BIGINT,
    führungskraft_count BIGINT,
    team_leader_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.team_level,
        COUNT(u.id) as total_members,
        COUNT(CASE WHEN u.is_team_leader THEN 1 END) as team_leaders,
        COUNT(CASE WHEN u.role = 'berater' THEN 1 END) as berater_count,
        COUNT(CASE WHEN u.role = 'trainee' THEN 1 END) as trainee_count,
        COUNT(CASE WHEN u.role = 'führungskraft' THEN 1 END) as führungskraft_count,
        (SELECT u2.firstname || ' ' || u2.lastname FROM users u2 WHERE u2.team_leader_for = t.id AND u2.is_team_leader = TRUE LIMIT 1) as team_leader_name
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id
    WHERE t.id = team_id_param
    GROUP BY t.id, t.name, t.team_level;
END;
$$ LANGUAGE plpgsql;

-- 8. Create function for team performance data
CREATE OR REPLACE FUNCTION get_team_performance(team_id_param UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_role TEXT,
    total_entries BIGINT,
    fa_total BIGINT,
    eh_total BIGINT,
    new_appointments_total BIGINT,
    recommendations_total BIGINT,
    last_activity DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(de.id) as total_entries,
        COALESCE(SUM(de.fa_count), 0) as fa_total,
        COALESCE(SUM(de.eh_count), 0) as eh_total,
        COALESCE(SUM(de.new_appointments), 0) as new_appointments_total,
        COALESCE(SUM(de.recommendations), 0) as recommendations_total,
        MAX(de.entry_date) as last_activity
    FROM users u
    LEFT JOIN daily_entries de ON de.user_id = u.id 
        AND de.entry_date >= start_date 
        AND de.entry_date <= end_date
    WHERE u.team_id = team_id_param
    GROUP BY u.id, u.name, u.role
    ORDER BY u.is_team_leader DESC, u.name ASC;
END;
$$ LANGUAGE plpgsql;

-- 9. Update RLS policies for correct role structure
DROP POLICY IF EXISTS "Events can be created by admins and leaders" ON events;
DROP POLICY IF EXISTS "Events can be updated by admins and leaders" ON events;
DROP POLICY IF EXISTS "Events can be deleted by admins and leaders" ON events;

CREATE POLICY "Events can be created by admins and führungskraft" ON events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'führungskraft')
        )
    );

CREATE POLICY "Events can be updated by admins and führungskraft" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'führungskraft')
        )
    );

CREATE POLICY "Events can be deleted by admins and führungskraft" ON events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'führungskraft')
        )
    );

-- 10. Verify the final setup
SELECT 'FINAL STATE - Corrected roles:' as status;
SELECT DISTINCT role FROM users ORDER BY role;

SELECT 'FINAL STATE - Users with corrected roles:' as status;
SELECT id, email, firstname, lastname, name, role, team_name FROM users ORDER BY role, name;

-- Success message
SELECT 'Role mapping completed successfully!' as status;
