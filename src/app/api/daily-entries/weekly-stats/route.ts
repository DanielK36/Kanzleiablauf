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
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate current week's start and end dates (Monday to Friday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 1, Sunday = 0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday

    // Get all entries for current week
    const { data: entries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('fa_count, eh_count, new_appointments, recommendations')
      .eq('user_id', user.id)
      .gte('entry_date', weekStart.toISOString().split('T')[0])
      .lte('entry_date', weekEnd.toISOString().split('T')[0]);

    if (entriesError) {
      console.error('Error fetching weekly entries:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch weekly entries' }, { status: 500 });
    }

    // Calculate totals
    const totals = entries.reduce((acc, entry) => ({
      fa_total: acc.fa_total + (entry.fa_count || 0),
      eh_total: acc.eh_total + (entry.eh_count || 0),
      appointments_total: acc.appointments_total + (entry.new_appointments || 0),
      recommendations_total: acc.recommendations_total + (entry.recommendations || 0)
    }), { fa_total: 0, eh_total: 0, appointments_total: 0, recommendations_total: 0 });

    // Calculate averages
    const daysWithEntries = entries.length || 1; // Avoid division by zero
    const averages = {
      fa_average: Math.round(totals.fa_total / daysWithEntries),
      eh_average: Math.round(totals.eh_total / daysWithEntries),
      appointments_average: Math.round(totals.appointments_total / daysWithEntries),
      recommendations_average: Math.round(totals.recommendations_total / daysWithEntries)
    };

    const stats = {
      ...totals,
      ...averages,
      days_worked: daysWithEntries,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0]
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error in GET /api/daily-entries/weekly-stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
