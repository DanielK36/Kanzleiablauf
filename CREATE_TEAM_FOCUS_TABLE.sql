-- Create team_focus table for storing daily team focus data
CREATE TABLE IF NOT EXISTS team_focus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(100) NOT NULL,
    focus_date DATE NOT NULL,
    training TEXT DEFAULT '',
    phone_party TEXT DEFAULT '',
    training_responsible VARCHAR(255) DEFAULT '',
    phone_party_responsible VARCHAR(255) DEFAULT '',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_name, focus_date)
);

-- Enable RLS
ALTER TABLE team_focus ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Team focus is viewable by team members" ON team_focus
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.team_name = team_focus.team_name
        )
    );

CREATE POLICY "Team focus can be created by team members" ON team_focus
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.team_name = team_focus.team_name
        )
    );

CREATE POLICY "Team focus can be updated by team members" ON team_focus
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.clerk_id = auth.jwt() ->> 'sub' 
            AND users.team_name = team_focus.team_name
        )
    );

-- Add indexes for better performance
CREATE INDEX idx_team_focus_team_date ON team_focus(team_name, focus_date);
CREATE INDEX idx_team_focus_date ON team_focus(focus_date);

-- Success message
SELECT 'Team focus table created successfully!' as status;
