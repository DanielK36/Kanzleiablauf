-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  parent_team_id INTEGER REFERENCES teams(id),
  team_level INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert team hierarchy
INSERT INTO teams (name, parent_team_id, team_level, description) VALUES
-- Level 1: Top Level
('GameChanger', NULL, 1, 'Top Level - Admin only'),

-- Level 2: Main Teams (all under GameChanger)
('Goalgetter', 1, 2, 'Main team under GameChanger'),
('Proud', 1, 2, 'Main team under GameChanger'),
('Eagles', 1, 2, 'Main team under GameChanger'),
('Visionäre', 1, 2, 'Main team under GameChanger'),
('Hurricane', 1, 2, 'Main team under GameChanger'),
('Alpha', 1, 2, 'Main team under GameChanger'),

-- Level 3: Sub-teams under Goalgetter
('Straw Hats', 2, 3, 'Sub-team of Goalgetter'),
('Eys Breaker', 2, 3, 'Sub-team of Goalgetter')

ON CONFLICT (name) DO NOTHING;

-- Update users table to reference teams
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_leader_id INTEGER REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_parent ON teams(parent_team_id);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_leader_id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams
CREATE POLICY "Teams are viewable by everyone" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Teams are manageable by admin" ON teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.clerk_id = auth.uid()::text 
      AND users.role = 'admin'
    )
  );

-- Update users RLS policy to include team access
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data and team members" ON users
  FOR SELECT USING (
    clerk_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users u1 
      WHERE u1.clerk_id = auth.uid()::text 
      AND (
        u1.role = 'admin' OR
        (u1.team_id = users.team_id AND u1.role IN ('top_leader', 'sub_leader')) OR
        (u1.id = users.parent_leader_id)
      )
    )
  );
