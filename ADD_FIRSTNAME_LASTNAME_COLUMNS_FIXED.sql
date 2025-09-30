-- Add firstName and lastName columns to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS firstName VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastName VARCHAR(100);

-- Update existing records to split name into firstName and lastName
UPDATE users 
SET 
  firstName = CASE 
    WHEN name IS NOT NULL AND name != '' THEN 
      CASE 
        WHEN position(' ' in name) > 0 THEN 
          substring(name from 1 for position(' ' in name) - 1)
        ELSE name
      END
    ELSE NULL
  END,
  lastName = CASE 
    WHEN name IS NOT NULL AND name != '' THEN 
      CASE 
        WHEN position(' ' in name) > 0 THEN 
          substring(name from position(' ' in name) + 1)
        ELSE NULL
      END
    ELSE NULL
  END
WHERE firstName IS NULL OR lastName IS NULL;
