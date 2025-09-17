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
    
    // Get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all daily entries for debugging
    const { data: allEntries, error: allEntriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false });

    // Calculate current month's start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get entries for current month
    const { data: monthlyEntries, error: monthlyEntriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', monthStart.toISOString().split('T')[0])
      .lte('entry_date', monthEnd.toISOString().split('T')[0]);

    return NextResponse.json({
      success: true,
      debug: {
        userId: user.id,
        monthStart: monthStart.toISOString().split('T')[0],
        monthEnd: monthEnd.toISOString().split('T')[0],
        allEntriesCount: allEntries?.length || 0,
        monthlyEntriesCount: monthlyEntries?.length || 0,
        allEntries: allEntries,
        monthlyEntries: monthlyEntries,
        personalTargets: user.personal_targets
      }
    });
  } catch (error) {
    console.error('Error in test-monthly-data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
