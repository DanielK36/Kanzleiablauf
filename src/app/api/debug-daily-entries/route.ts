import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, clerk_id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found', details: userError?.message }, { status: 404 });
    }

    // Get all daily entries for this user (last 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const { data: allEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', sevenDaysAgoStr)
      .order('entry_date', { ascending: false });

    // Calculate yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return NextResponse.json({
      success: true,
      debug: {
        user: {
          id: user.id,
          name: user.name,
          clerk_id: user.clerk_id
        },
        dates: {
          today: today.toISOString().split('T')[0],
          yesterday: yesterdayStr,
          sevenDaysAgo: sevenDaysAgoStr
        },
        allEntries: allEntries || [],
        entriesCount: allEntries?.length || 0,
        yesterdayEntry: allEntries?.find(entry => entry.entry_date === yesterdayStr) || null,
        error: entriesError
      }
    });

  } catch (error) {
    console.error('Error in debug-daily-entries:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}