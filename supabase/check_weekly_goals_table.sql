-- Check if weekly_goals table exists and its structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'weekly_goals'
ORDER BY ordinal_position;

-- Check if table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'weekly_goals'
);

-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS weekly_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    fa_weekly_target INTEGER DEFAULT 0,
    eh_weekly_target INTEGER DEFAULT 0,
    new_appointments_weekly_target INTEGER DEFAULT 0,
    recommendations_weekly_target INTEGER DEFAULT 0,
    tiv_invitations_weekly_target INTEGER DEFAULT 0,
    taa_invitations_weekly_target INTEGER DEFAULT 0,
    tgs_registrations_weekly_target INTEGER DEFAULT 0,
    bav_checks_weekly_target INTEGER DEFAULT 0,
    additional_goal TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_week ON weekly_goals(user_id, week_start_date);

-- Verify the table was created
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'weekly_goals'
ORDER BY ordinal_position;
