-- Remove temp clerk_id and set it to NULL so APIs can find the user by name
UPDATE users 
SET clerk_id = NULL
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- Verify the update
SELECT 'Updated clerk_id to NULL:' as info, clerk_id, firstname, lastname, name, role 
FROM users 
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';
