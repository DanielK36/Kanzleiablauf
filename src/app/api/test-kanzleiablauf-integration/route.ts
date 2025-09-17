import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Test the complete integration flow
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Get team members
    const { data: advisors, error: advisorsError } = await supabase
      .from('users')
      .select('id, name, role, monthly_targets, personal_targets')
      .in('role', ['advisor', 'trainee'])
      .limit(2);

    if (advisorsError) {
      return NextResponse.json({ error: 'Failed to fetch advisors', details: advisorsError.message }, { status: 500 });
    }

    // 2. Get yesterday's entries
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const advisorIds = advisors?.map(advisor => advisor.id) || [];
    let yesterdayEntries = [];
    let todayEntries = [];
    let weeklyEntries = [];
    let monthlyEntries = [];

    if (advisorIds.length > 0) {
      // Yesterday's entries
      const { data: yEntries } = await supabase
        .from('daily_entries')
        .select('user_id, fa_count, eh_count, new_appointments, recommendations, tiv_invitations, taa_invitations, tgs_registrations, bav_checks, highlight_yesterday, appointments_next_week, weekly_improvement')
        .in('user_id', advisorIds)
        .eq('entry_date', yesterdayStr);

      // Today's entries
      const { data: tEntries } = await supabase
        .from('daily_entries')
        .select('user_id, fa_count, eh_count, new_appointments, recommendations, tiv_invitations, taa_invitations, tgs_registrations, bav_checks, help_needed, training_focus, improvement_today, today_goals, today_todos')
        .in('user_id', advisorIds)
        .eq('entry_date', today);

      // Weekly entries (last 7 days)
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data: wEntries } = await supabase
        .from('daily_entries')
        .select('user_id, fa_count, eh_count, new_appointments, recommendations, tiv_invitations, taa_invitations, tgs_registrations, bav_checks')
        .in('user_id', advisorIds)
        .gte('entry_date', weekStartStr)
        .lte('entry_date', today);

      // Monthly entries (this month)
      const monthStart = new Date(today);
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data: mEntries } = await supabase
        .from('daily_entries')
        .select('user_id, fa_count, eh_count, new_appointments, recommendations, tiv_invitations, taa_invitations, tgs_registrations, bav_checks')
        .in('user_id', advisorIds)
        .gte('entry_date', monthStartStr)
        .lte('entry_date', today);

      yesterdayEntries = yEntries || [];
      todayEntries = tEntries || [];
      weeklyEntries = wEntries || [];
      monthlyEntries = mEntries || [];
    }

    // 3. Simulate the team totals calculation
    const teamTotals = {
      yesterday: {
        fa_total: yesterdayEntries.reduce((sum, entry) => sum + (entry.fa_count || 0), 0),
        eh_total: yesterdayEntries.reduce((sum, entry) => sum + (entry.eh_count || 0), 0),
        new_appointments_total: yesterdayEntries.reduce((sum, entry) => sum + (entry.new_appointments || 0), 0),
        recommendations_total: yesterdayEntries.reduce((sum, entry) => sum + (entry.recommendations || 0), 0),
        tiv_invitations_total: yesterdayEntries.reduce((sum, entry) => sum + (entry.tiv_invitations || 0), 0),
        taa_invitations_total: yesterdayEntries.reduce((sum, entry) => sum + (entry.taa_invitations || 0), 0),
        tgs_registrations_total: yesterdayEntries.reduce((sum, entry) => sum + (entry.tgs_registrations || 0), 0),
        bav_checks_total: yesterdayEntries.reduce((sum, entry) => sum + (entry.bav_checks || 0), 0)
      },
      monthly: {
        fa_total: monthlyEntries.reduce((sum, entry) => sum + (entry.fa_count || 0), 0),
        fa_target: advisors?.reduce((sum, advisor) => sum + ((advisor.monthly_targets?.fa_target) || 0), 0) || 0,
        eh_total: monthlyEntries.reduce((sum, entry) => sum + (entry.eh_count || 0), 0),
        eh_target: advisors?.reduce((sum, advisor) => sum + ((advisor.monthly_targets?.eh_target) || 0), 0) || 0,
        new_appointments_total: monthlyEntries.reduce((sum, entry) => sum + (entry.new_appointments || 0), 0),
        new_appointments_target: advisors?.reduce((sum, advisor) => sum + ((advisor.monthly_targets?.new_appointments_target) || 0), 0) || 0,
        recommendations_total: monthlyEntries.reduce((sum, entry) => sum + (entry.recommendations || 0), 0),
        recommendations_target: advisors?.reduce((sum, advisor) => sum + ((advisor.monthly_targets?.recommendations_target) || 0), 0) || 0
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Kanzleiablauf integration test completed',
      date: today,
      yesterday: yesterdayStr,
      advisors: advisors || [],
      entries: {
        yesterday: yesterdayEntries.length,
        today: todayEntries.length,
        weekly: weeklyEntries.length,
        monthly: monthlyEntries.length
      },
      teamTotals: teamTotals,
      sampleData: {
        yesterdayEntries: yesterdayEntries.slice(0, 2),
        todayEntries: todayEntries.slice(0, 2),
        weeklyEntries: weeklyEntries.slice(0, 3),
        monthlyEntries: monthlyEntries.slice(0, 3)
      },
      testResult: {
        hasAdvisors: advisors && advisors.length > 0,
        hasYesterdayData: yesterdayEntries.length > 0,
        hasTodayData: todayEntries.length > 0,
        hasWeeklyData: weeklyEntries.length > 0,
        hasMonthlyData: monthlyEntries.length > 0,
        teamTotalsCalculated: true,
        status: "READY FOR KANZLEIABLAUF PAGE TEST"
      }
    });
  } catch (error) {
    console.error('Error in test-kanzleiablauf-integration:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
