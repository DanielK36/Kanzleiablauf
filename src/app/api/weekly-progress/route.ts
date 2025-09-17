import { NextRequest, NextResponse } from 'next/server';
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

    // Calculate current week's start and end dates
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days to Monday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday);
    const weekStartDate = weekStart.toISOString().split('T')[0];
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndDate = weekEnd.toISOString().split('T')[0];

    // Get weekly goals for current week
    const { data: weeklyGoals, error: goalsError } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartDate)
      .single();

    // Get daily entries for current week
    const { data: dailyEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('fa_count, eh_count, new_appointments, recommendations, tiv_invitations, taa_invitations, tgs_registrations, bav_checks')
      .eq('user_id', user.id)
      .gte('entry_date', weekStartDate)
      .lte('entry_date', weekEndDate);

    if (entriesError) {
      console.error('Error fetching weekly entries:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch weekly entries' }, { status: 500 });
    }

    // Calculate weekly totals from daily entries
    const weeklyTotals = dailyEntries.reduce((acc, entry) => ({
      fa_current: acc.fa_current + (entry.fa_count || 0),
      eh_current: acc.eh_current + (entry.eh_count || 0),
      new_appointments_current: acc.new_appointments_current + (entry.new_appointments || 0),
      recommendations_current: acc.recommendations_current + (entry.recommendations || 0),
      tiv_invitations_current: acc.tiv_invitations_current + (entry.tiv_invitations || 0),
      taa_invitations_current: acc.taa_invitations_current + (entry.taa_invitations || 0),
      tgs_registrations_current: acc.tgs_registrations_current + (entry.tgs_registrations || 0),
      bav_checks_current: acc.bav_checks_current + (entry.bav_checks || 0)
    }), {
      fa_current: 0,
      eh_current: 0,
      new_appointments_current: 0,
      recommendations_current: 0,
      tiv_invitations_current: 0,
      taa_invitations_current: 0,
      tgs_registrations_current: 0,
      bav_checks_current: 0
    });

    // Combine weekly goals with current progress
    const weeklyProgress = {
      fa_current: weeklyTotals.fa_current,
      fa_target: weeklyGoals?.fa_weekly_target || 0,
      eh_current: weeklyTotals.eh_current,
      eh_target: weeklyGoals?.eh_weekly_target || 0,
      new_appointments_current: weeklyTotals.new_appointments_current,
      new_appointments_target: weeklyGoals?.new_appointments_weekly_target || 0,
      recommendations_current: weeklyTotals.recommendations_current,
      recommendations_target: weeklyGoals?.recommendations_weekly_target || 0,
      tiv_invitations_current: weeklyTotals.tiv_invitations_current,
      tiv_invitations_target: weeklyGoals?.tiv_invitations_weekly_target || 0,
      taa_invitations_current: weeklyTotals.taa_invitations_current,
      taa_invitations_target: weeklyGoals?.taa_invitations_weekly_target || 0,
      tgs_registrations_current: weeklyTotals.tgs_registrations_current,
      tgs_registrations_target: weeklyGoals?.tgs_registrations_weekly_target || 0,
      bav_checks_current: weeklyTotals.bav_checks_current,
      bav_checks_target: weeklyGoals?.bav_checks_weekly_target || 0,
      additional_goal: weeklyGoals?.additional_goal || '',
      week_start_date: weekStartDate,
      week_end_date: weekEndDate
    };

    return NextResponse.json({ 
      success: true, 
      weeklyProgress,
      weeklyGoals: weeklyGoals || {
        fa_weekly_target: 0,
        eh_weekly_target: 0,
        new_appointments_weekly_target: 0,
        recommendations_weekly_target: 0,
        tiv_invitations_weekly_target: 0,
        taa_invitations_weekly_target: 0,
        tgs_registrations_weekly_target: 0,
        bav_checks_weekly_target: 0,
        additional_goal: ''
      }
    });
  } catch (error) {
    console.error('Error in GET /api/weekly-progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
