-- CORRECT ROLE STRUCTURE AND TEAM LEADER SYSTEM
-- This script implements the correct role structure: admin, führungskraft, berater, trainee
-- And implements team leader functionality

-- 1. Check current state
SELECT 'CURRENT STATE - User roles:' as status;
SELECT DISTINCT role FROM users;

SELECT 'CURRENT STATE - Users with roles:' as status;
SELECT id, email, firstName, lastName, name, role, team_name FROM users ORDER BY role, name;

-- 2. Update role constraint to match actual system
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'führungskraft', 'berater', 'trainee'));

-- 3. Add team leader columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_leader_for INTEGER REFERENCES teams(id);

-- 4. Update existing roles to match the correct structure
-- Map old roles to new structure
UPDATE users SET role = 'führungskraft' WHERE role IN ('top_leader', 'sub_leader');
UPDATE users SET role = 'berater' WHERE role = 'advisor';

-- 5. Create function to set team leader
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

-- 6. Create function to get team leader
CREATE OR REPLACE FUNCTION get_team_leader(team_id_param UUID)
RETURNS TABLE (
    id UUID,
    firstname VARCHAR,
    lastname VARCHAR,
    name TEXT,
    email TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.firstname, u.lastname, u.name, u.email, u.role
    FROM users u
    WHERE u.team_leader_for = team_id_param AND u.is_team_leader = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get team members (excluding leader)
CREATE OR REPLACE FUNCTION get_team_members(team_id_param UUID)
RETURNS TABLE (
    id UUID,
    firstname VARCHAR,
    lastname VARCHAR,
    name TEXT,
    email TEXT,
    role TEXT,
    is_team_leader BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.firstname, u.lastname, u.name, u.email, u.role, u.is_team_leader
    FROM users u
    WHERE u.team_id = team_id_param
    ORDER BY u.is_team_leader DESC, u.name ASC;
END;
$$ LANGUAGE plpgsql;

-- 8. Update RLS policies for correct role structure
-- Drop existing policies
DROP POLICY IF EXISTS "Events can be created by admins and leaders" ON events;
DROP POLICY IF EXISTS "Events can be updated by admins and leaders" ON events;
DROP POLICY IF EXISTS "Events can be deleted by admins and leaders" ON events;

-- Create new policies with correct roles
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

-- 9. Update other policies with correct roles
DROP POLICY IF EXISTS "Event speakers can be managed by admins and leaders" ON event_speakers;
CREATE POLICY "Event speakers can be managed by admins and führungskraft" ON event_speakers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'führungskraft')
        )
    );

DROP POLICY IF EXISTS "Users can update their own registrations" ON event_registrations;
CREATE POLICY "Users can update their own registrations" ON event_registrations
    FOR UPDATE USING (
        user_id = (
            SELECT id FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.role IN ('admin', 'führungskraft')
        )
    );

-- 10. Create view for team analytics (for team leaders)
CREATE OR REPLACE VIEW team_analytics AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.team_level,
    COUNT(u.id) as total_members,
    COUNT(CASE WHEN u.is_team_leader THEN 1 END) as team_leaders,
    COUNT(CASE WHEN u.role = 'berater' THEN 1 END) as berater_count,
    COUNT(CASE WHEN u.role = 'trainee' THEN 1 END) as trainee_count,
    COUNT(CASE WHEN u.role = 'führungskraft' THEN 1 END) as führungskraft_count,
    -- Get team leader info
    (SELECT u2.firstname || ' ' || u2.lastname FROM users u2 WHERE u2.team_leader_for = t.id AND u2.is_team_leader = TRUE LIMIT 1) as team_leader_name
FROM teams t
LEFT JOIN users u ON u.team_id = t.id
GROUP BY t.id, t.name, t.team_level;

-- 11. Create function for team performance data (for team leaders)
CREATE OR REPLACE FUNCTION get_team_performance(team_id_param UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_role TEXT,
    total_entries INTEGER,
    fa_total INTEGER,
    eh_total INTEGER,
    new_appointments_total INTEGER,
    recommendations_total INTEGER,
    last_activity DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(de.id)::INTEGER as total_entries,
        COALESCE(SUM(de.fa_count), 0)::INTEGER as fa_total,
        COALESCE(SUM(de.eh_count), 0)::INTEGER as eh_total,
        COALESCE(SUM(de.new_appointments), 0)::INTEGER as new_appointments_total,
        COALESCE(SUM(de.recommendations), 0)::INTEGER as recommendations_total,
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

-- 12. Insert sample team leaders (if teams exist)
-- This will set some users as team leaders for demonstration
DO $$
DECLARE
    team_record RECORD;
    user_record RECORD;
BEGIN
    -- For each team, try to set a führungskraft as team leader
    FOR team_record IN SELECT id, name FROM teams WHERE name != 'GameChanger' LOOP
        -- Find a führungskraft for this team
        SELECT * INTO user_record 
        FROM users 
        WHERE team_id = team_record.id 
        AND role = 'führungskraft' 
        LIMIT 1;
        
        -- If found, set as team leader
        IF user_record.id IS NOT NULL THEN
            PERFORM set_team_leader(team_record.id, user_record.id);
            RAISE NOTICE 'Set % as team leader for %', user_record.name, team_record.name;
        END IF;
    END LOOP;
END $$;

-- 13. Verify the final setup
SELECT 'FINAL STATE - Corrected roles:' as status;
SELECT DISTINCT role FROM users ORDER BY role;

SELECT 'FINAL STATE - Team leaders:' as status;
SELECT 
    t.name as team_name,
    u.name as leader_name,
    u.email as leader_email,
    u.role as leader_role
FROM teams t
LEFT JOIN users u ON u.team_leader_for = t.id AND u.is_team_leader = TRUE
ORDER BY t.name;

SELECT 'FINAL STATE - Team analytics:' as status;
SELECT * FROM team_analytics ORDER BY team_name;

-- Success message
SELECT 'Role structure corrected and team leader system implemented!' as status;
