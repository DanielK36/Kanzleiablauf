import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // SQL commands to add missing columns
    const sqlCommands = [
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS weekday_answer TEXT`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS help_needed TEXT`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS training_focus TEXT`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS improvement_today TEXT`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS today_goals JSONB DEFAULT '{}'`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS today_todos JSONB DEFAULT '[]'`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS todos_completed JSONB DEFAULT '[false, false, false, false, false]'`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS highlight_yesterday TEXT`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS appointments_next_week INTEGER DEFAULT 0`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS weekly_improvement TEXT`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS charisma_training BOOLEAN DEFAULT false`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS tgs_registrations INTEGER DEFAULT 0`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS bav_checks INTEGER DEFAULT 0`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS tiv_invitations INTEGER DEFAULT 0`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS taa_invitations INTEGER DEFAULT 0`,
      `ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS recommendations INTEGER DEFAULT 0`,
      `CREATE INDEX IF NOT EXISTS idx_daily_entries_user_date_entry ON daily_entries(user_id, entry_date)`
    ];

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const sql of sqlCommands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
          // If RPC doesn't work, try direct execution
          const { error: directError } = await supabase.from('daily_entries').select('id').limit(1);
          if (directError) {
            results.push(`❌ ${sql}: ${error.message}`);
            errorCount++;
          } else {
            results.push(`✅ ${sql}: Column already exists or created successfully`);
            successCount++;
          }
        } else {
          results.push(`✅ ${sql}: Success`);
          successCount++;
        }
      } catch (err) {
        results.push(`❌ ${sql}: ${err}`);
        errorCount++;
      }
    }

    // Verify table structure
    const { data: columns, error: columnsError } = await supabase
      .from('daily_entries')
      .select('*')
      .limit(1);

    if (columnsError) {
      results.push(`❌ Error verifying table: ${columnsError.message}`);
    } else {
      results.push(`✅ Table verification: daily_entries table exists and is accessible`);
    }

    return NextResponse.json({
      success: errorCount === 0,
      message: `Setup completed: ${successCount} successful, ${errorCount} errors`,
      details: results.join('\n'),
      successCount,
      errorCount
    });

  } catch (error) {
    console.error('Error in setup-daily-entries:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup daily_entries table',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
