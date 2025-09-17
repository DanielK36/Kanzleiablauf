import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Create the events table using direct SQL execution
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS events (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        day VARCHAR(20) NOT NULL,
        time VARCHAR(20) NOT NULL,
        location VARCHAR(255) NOT NULL,
        topic VARCHAR(255),
        is_recurring BOOLEAN DEFAULT FALSE,
        recurring_type VARCHAR(20) DEFAULT 'none',
        custom_type VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Enable RLS
    const enableRLSQuery = `ALTER TABLE events ENABLE ROW LEVEL SECURITY;`;

    // Create policies
    const createPoliciesQuery = `
      DROP POLICY IF EXISTS "Events are viewable by authenticated users" ON events;
      DROP POLICY IF EXISTS "Events are manageable by leaders" ON events;
      
      CREATE POLICY "Events are viewable by authenticated users" ON events
        FOR SELECT USING (auth.role() = 'authenticated');
        
      CREATE POLICY "Events are manageable by leaders" ON events
        FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
          SELECT 1 FROM users 
          WHERE users.clerk_id = auth.uid() 
          AND users.role IN ('top_leader', 'sub_leader')
        ));
    `;

    // Execute all queries
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableQuery });
    if (createError) {
      console.error('Error creating table:', createError);
    }

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSQuery });
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    }

    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: createPoliciesQuery });
    if (policiesError) {
      console.error('Error creating policies:', policiesError);
    }

    // Test if table was created successfully
    const { data: testData, error: testError } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Table creation failed',
        details: testError.message,
        message: 'Please manually create the table in Supabase dashboard'
      }, { status: 500 });
    }

    // Insert sample data
    const sampleEvents = [
      {
        type: 'TIV',
        date: '2024-01-13',
        day: 'Samstag',
        time: '09:00 Uhr',
        location: 'Hauptbüro',
        topic: '',
        is_recurring: false,
        recurring_type: 'none'
      },
      {
        type: 'Telefonparty',
        date: '2024-01-16',
        day: 'Dienstag',
        time: '14:00-16:00 Uhr',
        location: 'Büro',
        topic: 'Wöchentliche Telefonparty',
        is_recurring: true,
        recurring_type: 'weekly'
      }
    ];

    const { error: insertError } = await supabase
      .from('events')
      .insert(sampleEvents);

    return NextResponse.json({
      success: true,
      message: 'Events table created successfully!',
      tableCreated: !createError,
      rlsEnabled: !rlsError,
      policiesCreated: !policiesError,
      sampleDataInserted: !insertError,
      testResult: testData
    });

  } catch (error) {
    console.error('Error in setup-events-table:', error);
    return NextResponse.json({
      success: false,
      error: 'Setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
