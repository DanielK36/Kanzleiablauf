-- CLEAN ROLE MAPPING - Bereinigte Version ohne Syntax-Fehler

-- 1. Drop existing role constraint to avoid conflicts
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Add new role constraint with correct roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'führungskraft', 'berater', 'trainee'));

-- 3. Map old roles to new roles
UPDATE users SET role = 'führungskraft' WHERE role IN ('top_leader', 'sub_leader');
UPDATE users SET role = 'berater' WHERE role = 'advisor';

-- 4. Add team leader columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_leader_for INTEGER REFERENCES teams(id);

-- 5. Create team leader functions
CREATE OR REPLACE FUNCTION set_team_leader(user_id_param UUID, team_id_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    -- Remove existing team leader status
    UPDATE users SET is_team_leader = FALSE, team_leader_for = NULL 
    WHERE team_leader_for = team_id_param;
    
    -- Set new team leader
    UPDATE users SET is_team_leader = TRUE, team_leader_for = team_id_param 
    WHERE id = user_id_param;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 6. Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS get_team_analytics(INTEGER);
DROP FUNCTION IF EXISTS get_team_performance(INTEGER);

-- 7. Create team analytics function
CREATE OR REPLACE FUNCTION get_team_analytics(team_id_param INTEGER)
RETURNS TABLE (
    team_name TEXT,
    total_members INTEGER,
    active_members INTEGER,
    weekly_fa INTEGER,
    weekly_eh INTEGER,
    monthly_fa INTEGER,
    monthly_eh INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name::TEXT,
        COUNT(u.id)::INTEGER as total_members,
        COUNT(CASE WHEN de.id IS NOT NULL THEN 1 END)::INTEGER as active_members,
        COALESCE(SUM(de.fa_count), 0)::INTEGER as weekly_fa,
        COALESCE(SUM(de.eh_count), 0)::INTEGER as weekly_eh,
        COALESCE(SUM(de.fa_count), 0)::INTEGER as monthly_fa,
        COALESCE(SUM(de.eh_count), 0)::INTEGER as monthly_eh
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id
    LEFT JOIN daily_entries de ON de.user_id = u.id 
        AND de.entry_date >= CURRENT_DATE - INTERVAL '7 days'
    WHERE t.id = team_id_param
    GROUP BY t.id, t.name;
END;
$$ LANGUAGE plpgsql;

-- 8. Create team performance function
CREATE OR REPLACE FUNCTION get_team_performance(team_id_param INTEGER)
RETURNS TABLE (
    team_name TEXT,
    avg_daily_fa NUMERIC,
    avg_daily_eh NUMERIC,
    completion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name::TEXT,
        COALESCE(AVG(de.fa_count), 0)::NUMERIC as avg_daily_fa,
        COALESCE(AVG(de.eh_count), 0)::NUMERIC as avg_daily_eh,
        COALESCE(AVG(CASE WHEN de.fa_count > 0 THEN 1.0 ELSE 0.0 END), 0)::NUMERIC as completion_rate
    FROM teams t
    LEFT JOIN users u ON u.team_id = t.id
    LEFT JOIN daily_entries de ON de.user_id = u.id 
        AND de.entry_date >= CURRENT_DATE - INTERVAL '30 days'
    WHERE t.id = team_id_param
    GROUP BY t.id, t.name;
END;
$$ LANGUAGE plpgsql;

-- 9. Update RLS policies for new roles
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (
        auth.jwt() ->> 'sub' = clerk_id
    );

DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Team leaders can view team members" ON users;
CREATE POLICY "Team leaders can view team members" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'führungskraft')
        )
    );

-- 10. Verify the setup
SELECT 'CLEAN ROLE MAPPING COMPLETED' as status;
SELECT DISTINCT role FROM users ORDER BY role;
SELECT 'Role mapping completed successfully!' as final_status;
