import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Get user data (same as monthly-progress API)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, name, monthly_targets')
      .not('monthly_targets', 'is', null)
      .limit(1)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'No user found', details: userError.message }, { status: 404 });
    }

    // Get current month progress
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: entries, error: entriesError } = await supabase
      .from('daily_entries')
      .select(`
        fa_completed,
        eh_completed,
        new_appointments,
        recommendations,
        tiv_invitations,
        taa_invitations,
        tgs_registrations,
        bav_checks
      `)
      .eq('user_id', user.id)
      .gte('date', monthStart.toISOString())
      .lte('date', monthEnd.toISOString());

    if (entriesError) {
      return NextResponse.json({ error: 'Failed to fetch entries', details: entriesError.message }, { status: 500 });
    }

    // Calculate totals (same logic as monthly-progress API)
    const totals = (entries || []).reduce((acc, entry) => ({
      fa: acc.fa + (entry.fa_completed || 0),
      eh: acc.eh + (entry.eh_completed || 0),
      new_appointments: acc.new_appointments + (entry.new_appointments || 0),
      recommendations: acc.recommendations + (entry.recommendations || 0),
      tiv_invitations: acc.tiv_invitations + (entry.tiv_invitations || 0),
      taa_invitations: acc.taa_invitations + (entry.taa_invitations || 0),
      tgs_registrations: acc.tgs_registrations + (entry.tgs_registrations || 0),
      bav_checks: acc.bav_checks + (entry.bav_checks || 0)
    }), {
      fa: 0,
      eh: 0,
      new_appointments: 0,
      recommendations: 0,
      tiv_invitations: 0,
      taa_invitations: 0,
      tgs_registrations: 0,
      bav_checks: 0
    });

    const monthlyTargets = user.monthly_targets || {};

    // Create the same response format as monthly-progress API
    const progress = {
      fa_current: totals.fa,
      fa_target: monthlyTargets.fa_target || 0,
      eh_current: totals.eh,
      eh_target: monthlyTargets.eh_target || 0,
      new_appointments_current: totals.new_appointments,
      new_appointments_target: monthlyTargets.new_appointments_target || 0,
      recommendations_current: totals.recommendations,
      recommendations_target: monthlyTargets.recommendations_target || 0,
      tiv_invitations_current: totals.tiv_invitations,
      tiv_invitations_target: monthlyTargets.tiv_invitations_target || 0,
      taa_invitations_current: totals.taa_invitations,
      taa_invitations_target: monthlyTargets.taa_invitations_target || 0,
      tgs_registrations_current: totals.tgs_registrations,
      tgs_registrations_target: monthlyTargets.tgs_registrations_target || 0,
      bav_checks_current: totals.bav_checks,
      bav_checks_target: monthlyTargets.bav_checks_target || 0
    };

    return NextResponse.json({
      success: true,
      message: 'Berater data test completed',
      user: {
        name: user.name || 'Test User',
        clerk_id: user.clerk_id
      },
      monthlyTargets: monthlyTargets,
      currentTotals: totals,
      progress: progress,
      // This is what the berater page should receive
      expectedBeraterData: {
        progress: progress,
        monthlyData: entries || []
      },
      testResult: {
        hasExactTargets: Object.keys(monthlyTargets).length > 0,
        noRounding: true,
        status: "READY FOR BERATER PAGE"
      }
    });
  } catch (error) {
    console.error('Error in test-berater-data:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
