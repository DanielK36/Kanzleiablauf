import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // First, check if the column already exists by trying to select from it
    const { error: checkError } = await supabase
      .from('daily_entries')
      .select('weekday_answers')
      .limit(1);

    if (!checkError) {
      // Column already exists
      return NextResponse.json({ 
        success: true, 
        message: 'weekday_answers column already exists' 
      });
    }

    // Try to add the column using a direct SQL query
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE daily_entries ADD COLUMN weekday_answers JSONB DEFAULT '{}';`
      });

      if (error) {
        console.error('Error adding weekday_answers column:', error);
        return NextResponse.json({ 
          error: 'Failed to add weekday_answers column', 
          details: error.message 
        }, { status: 500 });
      }
    } catch (rpcError) {
      // If RPC doesn't work, provide manual SQL instruction
      console.error('RPC failed, providing manual SQL:', rpcError);
      return NextResponse.json({ 
        error: 'Automatic setup failed. Please run this SQL manually in your database:', 
        details: 'ALTER TABLE daily_entries ADD COLUMN weekday_answers JSONB DEFAULT \'{}\';',
        manualSql: true
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'weekday_answers column added successfully' 
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Setup failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
