-- Fix clerk_id for Daniel (admin) account
-- The issue is that the clerk_id in the users table doesn't match the current logged-in user

-- First, let's see what clerk_id is currently in the users table
SELECT 'Current clerk_id in users table:' as info, clerk_id, firstname, lastname, name, role 
FROM users 
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- We need to update the clerk_id to match the current logged-in user
-- You'll need to replace 'YOUR_CURRENT_CLERK_ID' with your actual clerk_id
-- To find your clerk_id, check the browser console or Clerk dashboard

-- UPDATE users 
-- SET clerk_id = 'YOUR_CURRENT_CLERK_ID'
-- WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- Alternative: If you don't know your clerk_id, we can set it to a placeholder
-- and then update it through the onboarding process
UPDATE users 
SET clerk_id = 'temp_clerk_id_' || id
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- Verify the update
SELECT 'Updated clerk_id:' as info, clerk_id, firstname, lastname, name, role 
FROM users 
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';
