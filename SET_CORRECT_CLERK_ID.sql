-- Set the correct clerk_id for Daniel (admin)
UPDATE users 
SET clerk_id = 'user_323Fmf0gM8mLKTuHGu1rSjDy6gm'
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';

-- Verify the update
SELECT 'Updated clerk_id:' as info, clerk_id, firstname, lastname, name, role 
FROM users 
WHERE id = '502e90ae-3557-48d1-8028-408fe9ee2c49';
