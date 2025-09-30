-- Transfer daily_entries from Daniel (admin) to Daniel (führungskraft)
-- Admin ID: df015a55-99dc-4bf0-b189-88e977a12ec8
-- Führungskraft ID: 502e90ae-3557-48d1-8028-408fe9ee2c49

-- Step 1: Update daily_entries to use the Führungskraft user_id
UPDATE daily_entries 
SET user_id = '502e90ae-3557-48d1-8028-408fe9ee2c49'
WHERE user_id = 'df015a55-99dc-4bf0-b189-88e977a12ec8';

-- Step 2: Update weekly_goals to use the Führungskraft user_id (if any exist)
UPDATE weekly_goals 
SET user_id = '502e90ae-3557-48d1-8028-408fe9ee2c49'
WHERE user_id = 'df015a55-99dc-4bf0-b189-88e977a12ec8';

-- Step 3: Update events to use the Führungskraft user_id (if any exist)
UPDATE events 
SET created_by = '502e90ae-3557-48d1-8028-408fe9ee2c49'
WHERE created_by = 'df015a55-99dc-4bf0-b189-88e977a12ec8';

-- Step 4: Update any other tables that might reference the admin user
-- Check if there are any other foreign key references
UPDATE event_registrations 
SET user_id = '502e90ae-3557-48d1-8028-408fe9ee2c49'
WHERE user_id = 'df015a55-99dc-4bf0-b189-88e977a12ec8';

-- Step 5: Change Daniel (führungskraft) role to admin
UPDATE users 
SET role = 'admin'
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- Step 6: Delete the old admin account
DELETE FROM users 
WHERE id = 'df015a55-99dc-4bf0-b189-88e977a12ec8';

-- Verify the changes
SELECT 'Updated daily_entries count:' as info, COUNT(*) as count 
FROM daily_entries 
WHERE user_id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

SELECT 'Updated weekly_goals count:' as info, COUNT(*) as count 
FROM weekly_goals 
WHERE user_id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

SELECT 'Daniel (now admin) info:' as info, id, firstname, lastname, name, role 
FROM users 
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

SELECT 'Remaining users:' as info, COUNT(*) as count 
FROM users;
