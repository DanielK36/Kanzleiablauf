import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Try to create the table by attempting to insert and handle the error
    const testEvent = {
      type: 'TEST',
      date: '2024-01-01',
      day: 'Montag',
      time: '09:00 Uhr',
      location: 'Test',
      topic: 'Test Event',
      is_recurring: false,
      recurring_type: 'none'
    };

    const { data, error } = await supabase
      .from('events')
      .insert([testEvent])
      .select();

    if (error) {
      if (error.code === 'PGRST205') {
        return NextResponse.json({
          success: false,
          error: 'Table does not exist',
          message: 'The events table needs to be created manually in Supabase',
          instructions: [
            '1. Go to your Supabase Dashboard',
            '2. Navigate to SQL Editor',
            '3. Run the following SQL script:',
            '',
            'CREATE TABLE events (',
            '  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,',
            '  type VARCHAR(50) NOT NULL,',
            '  date DATE NOT NULL,',
            '  day VARCHAR(20) NOT NULL,',
            '  time VARCHAR(20) NOT NULL,',
            '  location VARCHAR(255) NOT NULL,',
            '  topic VARCHAR(255),',
            '  is_recurring BOOLEAN DEFAULT FALSE,',
            '  recurring_type VARCHAR(20) DEFAULT \'none\',',
            '  custom_type VARCHAR(100),',
            '  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),',
            '  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()',
            ');',
            '',
            'ALTER TABLE events ENABLE ROW LEVEL SECURITY;',
            '',
            'CREATE POLICY "Events are viewable by authenticated users" ON events',
            '  FOR SELECT USING (auth.role() = \'authenticated\');',
            '',
            'CREATE POLICY "Events are manageable by leaders" ON events',
            '  FOR ALL USING (auth.role() = \'authenticated\' AND EXISTS (',
            '    SELECT 1 FROM users',
            '    WHERE users.clerk_id = auth.uid()::text',
            '    AND users.role IN (\'top_leader\', \'sub_leader\')',
            '  ));'
          ]
        }, { status: 500 });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Database error',
          details: error.message,
          code: error.code
        }, { status: 500 });
      }
    }

    // If we get here, the table exists and the test insert worked
    // Delete the test event
    await supabase
      .from('events')
      .delete()
      .eq('type', 'TEST');

    return NextResponse.json({
      success: true,
      message: 'Events table exists and is working correctly!',
      testResult: data
    });

  } catch (error) {
    console.error('Error in create-events-table:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
