-- Create team_goals table for Führungskräfte to set team targets
CREATE TABLE IF NOT EXISTS team_goals (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  set_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_type VARCHAR(20) NOT NULL CHECK (goal_type IN ('monthly', 'weekly')),
  goal_period DATE NOT NULL, -- First day of the month/week
  
  -- Monthly targets (set by Führungskraft)
  fa_monthly_target INTEGER DEFAULT 0,
  eh_monthly_target INTEGER DEFAULT 0,
  new_appointments_monthly_target INTEGER DEFAULT 0,
  recommendations_monthly_target INTEGER DEFAULT 0,
  tiv_invitations_monthly_target INTEGER DEFAULT 0,
  taa_invitations_monthly_target INTEGER DEFAULT 0,
  tgs_registrations_monthly_target INTEGER DEFAULT 0,
  bav_checks_monthly_target INTEGER DEFAULT 0,
  
  -- Weekly targets (set by Führungskraft) 
  fa_weekly_target INTEGER DEFAULT 0,
  eh_weekly_target INTEGER DEFAULT 0,
  new_appointments_weekly_target INTEGER DEFAULT 0,
  recommendations_weekly_target INTEGER DEFAULT 0,
  tiv_invitations_weekly_target INTEGER DEFAULT 0,
  taa_invitations_weekly_target INTEGER DEFAULT 0,
  tgs_registrations_weekly_target INTEGER DEFAULT 0,
  bav_checks_weekly_target INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one goal per team per period per type
  UNIQUE(team_id, goal_type, goal_period)
);

-- Create RLS policies
ALTER TABLE team_goals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view team goals for their team
CREATE POLICY "Users can view team goals for their team" ON team_goals
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Führungskräfte can insert/update team goals for their team
CREATE POLICY "Führungskräfte can manage team goals for their team" ON team_goals
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'führungskraft'
    )
  );

-- Policy: Admins can manage all team goals
CREATE POLICY "Admins can manage all team goals" ON team_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_goals_team_id ON team_goals(team_id);
CREATE INDEX IF NOT EXISTS idx_team_goals_period ON team_goals(goal_period);
CREATE INDEX IF NOT EXISTS idx_team_goals_type_period ON team_goals(goal_type, goal_period);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_team_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_team_goals_updated_at
  BEFORE UPDATE ON team_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_team_goals_updated_at();
