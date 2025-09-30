-- FIX TEAM LEADER FOREIGN KEY - Corrects datatype mismatch
-- This script fixes the UUID vs INTEGER conflict for team_leader_for

-- 1. Check current state
SELECT 'CURRENT STATE - Teams table structure:' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'id';

SELECT 'CURRENT STATE - Users table structure:' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id';

-- 2. Drop the problematic column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS team_leader_for;

-- 3. Add team_leader_for column with correct INTEGER type
ALTER TABLE users ADD COLUMN team_leader_for INTEGER REFERENCES teams(id);

-- 4. Recreate the set_team_leader function with correct types
CREATE OR REPLACE FUNCTION set_team_leader(team_id_param INTEGER, user_id_param UUID)
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

-- 5. Recreate the get_team_analytics function with correct types
CREATE OR REPLACE FUNCTION get_team_analytics(team_id_param INTEGER)
RETURNS TABLE (
    team_id INTEGER,
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

-- 6. Recreate the get_team_performance function with correct types
CREATE OR REPLACE FUNCTION get_team_performance(team_id_param INTEGER, start_date DATE, end_date DATE)
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

-- 7. Verify the fix
SELECT 'FINAL STATE - Users table with team_leader_for:' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'team_leader_for';

SELECT 'FINAL STATE - Teams table structure:' as status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'id';

-- Success message
SELECT 'Team leader foreign key fixed!' as status;
