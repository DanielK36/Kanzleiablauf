-- Add weekday_answers column to daily_entries table
ALTER TABLE daily_entries 
ADD COLUMN weekday_answers JSONB DEFAULT '{}';
