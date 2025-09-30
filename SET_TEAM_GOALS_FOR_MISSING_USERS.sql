-- SET TEAM GOALS FOR MISSING USERS
-- This script sets team goals for users who are missing them

-- 1. Show current team goals before update
SELECT 'BEFORE UPDATE - TEAM GOALS:' as status;
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

-- 2. Update Kosta's team goals (GameChanger team)
UPDATE users 
SET personal_targets = personal_targets || '{
    "fa_team_target": 50,
    "eh_team_target": 5000,
    "new_appointments_team_target": 20,
    "recommendations_team_target": 30,
    "tiv_invitations_team_target": 5,
    "bav_checks_team_target": 10,
    "taa_invitations_team_target": 5,
    "tgs_registrations_team_target": 2
}'::jsonb
WHERE id = '303d4d0a-1d8d-42d9-b3c3-4d4a92e821ad';

-- 3. Update Marcel's team goals (Visionäre team)
UPDATE users 
SET personal_targets = personal_targets || '{
    "fa_team_target": 30,
    "eh_team_target": 3000,
    "new_appointments_team_target": 15,
    "recommendations_team_target": 20,
    "tiv_invitations_team_target": 3,
    "bav_checks_team_target": 8,
    "taa_invitations_team_target": 3,
    "tgs_registrations_team_target": 1
}'::jsonb
WHERE id = 'a354807b-38c8-4a41-acbe-f93fcee40852';

-- 4. Update Philipp's team goals (Visionäre team)
UPDATE users 
SET personal_targets = personal_targets || '{
    "fa_team_target": 40,
    "eh_team_target": 4000,
    "new_appointments_team_target": 18,
    "recommendations_team_target": 25,
    "tiv_invitations_team_target": 4,
    "bav_checks_team_target": 9,
    "taa_invitations_team_target": 4,
    "tgs_registrations_team_target": 2
}'::jsonb
WHERE id = 'e45ef1c8-0014-4035-b625-574bcf7b1a09';

-- 5. Add missing tgs_registrations_team_target for Daniel
UPDATE users 
SET personal_targets = personal_targets || '{
    "tgs_registrations_team_target": 5
}'::jsonb
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- 6. Add missing tgs_registrations_team_target for Marcel
UPDATE users 
SET personal_targets = personal_targets || '{
    "tgs_registrations_team_target": 1
}'::jsonb
WHERE id = 'a354807b-38c8-4a41-acbe-f93fcee40852';

-- 7. Show updated team goals
SELECT 'AFTER UPDATE - TEAM GOALS:' as status;
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

-- 8. Verify all team goals are now set
SELECT 'VERIFICATION - ALL TEAM GOALS SET:' as status;
SELECT 
    name,
    CASE 
        WHEN personal_targets->>'fa_team_target' IS NOT NULL AND personal_targets->>'fa_team_target' != '0' THEN 'OK'
        ELSE 'Missing'
    END as fa_status,
    CASE 
        WHEN personal_targets->>'eh_team_target' IS NOT NULL AND personal_targets->>'eh_team_target' != '0' THEN 'OK'
        ELSE 'Missing'
    END as eh_status,
    CASE 
        WHEN personal_targets->>'new_appointments_team_target' IS NOT NULL AND personal_targets->>'new_appointments_team_target' != '0' THEN 'OK'
        ELSE 'Missing'
    END as new_appointments_status,
    CASE 
        WHEN personal_targets->>'recommendations_team_target' IS NOT NULL AND personal_targets->>'recommendations_team_target' != '0' THEN 'OK'
        ELSE 'Missing'
    END as recommendations_status,
    CASE 
        WHEN personal_targets->>'tiv_invitations_team_target' IS NOT NULL AND personal_targets->>'tiv_invitations_team_target' != '0' THEN 'OK'
        ELSE 'Missing'
    END as tiv_invitations_status,
    CASE 
        WHEN personal_targets->>'bav_checks_team_target' IS NOT NULL AND personal_targets->>'bav_checks_team_target' != '0' THEN 'OK'
        ELSE 'Missing'
    END as bav_checks_status,
    CASE 
        WHEN personal_targets->>'taa_invitations_team_target' IS NOT NULL AND personal_targets->>'taa_invitations_team_target' != '0' THEN 'OK'
        ELSE 'Missing'
    END as taa_invitations_status,
    CASE 
        WHEN personal_targets->>'tgs_registrations_team_target' IS NOT NULL AND personal_targets->>'tgs_registrations_team_target' != '0' THEN 'OK'
        ELSE 'Missing'
    END as tgs_registrations_status
FROM users 
ORDER BY name;
