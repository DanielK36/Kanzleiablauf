import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Create teams table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        parent_team_id INTEGER REFERENCES teams(id),
        team_level INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    });

    if (createTableError) {
      console.error('Error creating teams table:', createTableError);
      return NextResponse.json({ 
        error: 'Failed to create teams table', 
        details: createTableError.message 
      }, { status: 500 });
    }

    // Insert team hierarchy
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `INSERT INTO teams (name, parent_team_id, team_level, description) VALUES
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
        
        ON CONFLICT (name) DO NOTHING;`
    });

    if (insertError) {
      console.error('Error inserting teams:', insertError);
      return NextResponse.json({ 
        error: 'Failed to insert teams', 
        details: insertError.message 
      }, { status: 500 });
    }

    // Add team_id column to users table
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);'
    });

    if (addColumnError) {
      console.error('Error adding team_id column:', addColumnError);
      return NextResponse.json({ 
        error: 'Failed to add team_id column', 
        details: addColumnError.message 
      }, { status: 500 });
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_teams_parent ON teams(parent_team_id);
            CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);`
    });

    if (indexError) {
      console.error('Error creating indexes:', indexError);
      return NextResponse.json({ 
        error: 'Failed to create indexes', 
        details: indexError.message 
      }, { status: 500 });
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
            CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
            CREATE POLICY "Teams are manageable by admin" ON teams FOR ALL USING (
              EXISTS (
                SELECT 1 FROM users 
                WHERE users.clerk_id = auth.uid()::text 
                AND users.role = 'admin'
              )
            );`
    });

    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
      return NextResponse.json({ 
        error: 'Failed to setup RLS', 
        details: rlsError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Teams-Tabelle erfolgreich erstellt und konfiguriert' 
    });

  } catch (error) {
    console.error('Error in setup-teams:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
