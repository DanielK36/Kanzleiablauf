-- DEBUG TEAM GOALS
-- This script checks the team goals in personal_targets

-- 1. Check all users and their team goals
SELECT 'ALL USERS AND THEIR TEAM GOALS:' as status;
SELECT 
    id,
    firstname,
    lastname,
    name,
    role,
    team_name,
    personal_targets
FROM users 
ORDER BY name;

-- 2. Check specific team goals for each user
SELECT 'TEAM GOALS BREAKDOWN:' as status;
SELECT 
    name,
    role,
    team_name,
    personal_targets->>'fa_team_target' as fa_team_target,
    personal_targets->>'eh_team_target' as eh_team_target,
    personal_targets->>'new_appointments_team_target' as new_appointments_team_target,
    personal_targets->>'recommendations_team_target' as recommendations_team_target,
    personal_targets->>'tiv_invitations_team_target' as tiv_invitations_team_target,
    personal_targets->>'bav_checks_team_target' as bav_checks_team_target,
    personal_targets->>'taa_invitations_team_target' as taa_invitations_team_target,
    personal_targets->>'tgs_registrations_team_target' as tgs_registrations_team_target
FROM users 
ORDER BY name;

-- 3. Check if team goals are missing or 0
SELECT 'MISSING OR ZERO TEAM GOALS:' as status;
SELECT 
    name,
    role,
    team_name,
    CASE 
        WHEN personal_targets->>'fa_team_target' IS NULL OR personal_targets->>'fa_team_target' = '0' THEN 'Missing/Zero'
        ELSE 'OK'
    END as fa_team_status,
    CASE 
        WHEN personal_targets->>'eh_team_target' IS NULL OR personal_targets->>'eh_team_target' = '0' THEN 'Missing/Zero'
        ELSE 'OK'
    END as eh_team_status,
    CASE 
        WHEN personal_targets->>'new_appointments_team_target' IS NULL OR personal_targets->>'new_appointments_team_target' = '0' THEN 'Missing/Zero'
        ELSE 'OK'
    END as new_appointments_team_status,
    CASE 
        WHEN personal_targets->>'recommendations_team_target' IS NULL OR personal_targets->>'recommendations_team_target' = '0' THEN 'Missing/Zero'
        ELSE 'OK'
    END as recommendations_team_status,
    CASE 
        WHEN personal_targets->>'tiv_invitations_team_target' IS NULL OR personal_targets->>'tiv_invitations_team_target' = '0' THEN 'Missing/Zero'
        ELSE 'OK'
    END as tiv_invitations_team_status,
    CASE 
        WHEN personal_targets->>'bav_checks_team_target' IS NULL OR personal_targets->>'bav_checks_team_target' = '0' THEN 'Missing/Zero'
        ELSE 'OK'
    END as bav_checks_team_status,
    CASE 
        WHEN personal_targets->>'taa_invitations_team_target' IS NULL OR personal_targets->>'taa_invitations_team_target' = '0' THEN 'Missing/Zero'
        ELSE 'OK'
    END as taa_invitations_team_status,
    CASE 
        WHEN personal_targets->>'tgs_registrations_team_target' IS NULL OR personal_targets->>'tgs_registrations_team_target' = '0' THEN 'Missing/Zero'
        ELSE 'OK'
    END as tgs_registrations_team_status
FROM users 
ORDER BY name;
