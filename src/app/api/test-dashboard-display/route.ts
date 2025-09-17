import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, name, monthly_targets')
      .not('monthly_targets', 'is', null)
      .limit(1)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'No user found', details: userError.message }, { status: 404 });
    }

    // Simulate current month progress (some sample data)
    const currentProgress = {
      fa_current: 15,
      eh_current: 8,
      new_appointments_current: 12,
      recommendations_current: 7,
      tiv_invitations_current: 3,
      taa_invitations_current: 2,
      tgs_registrations_current: 1,
      bav_checks_current: 4
    };

    const monthlyTargets = user.monthly_targets || {};

    // Calculate dashboard display
    const dashboardDisplay = {
      fa: `${currentProgress.fa_current}/${monthlyTargets.fa_target || 0}`,
      eh: `${currentProgress.eh_current}/${monthlyTargets.eh_target || 0}`,
      new_appointments: `${currentProgress.new_appointments_current}/${monthlyTargets.new_appointments_target || 0}`,
      recommendations: `${currentProgress.recommendations_current}/${monthlyTargets.recommendations_target || 0}`,
      tiv_invitations: `${currentProgress.tiv_invitations_current}/${monthlyTargets.tiv_invitations_target || 0}`,
      taa_invitations: `${currentProgress.taa_invitations_current}/${monthlyTargets.taa_invitations_target || 0}`,
      tgs_registrations: `${currentProgress.tgs_registrations_current}/${monthlyTargets.tgs_registrations_target || 0}`,
      bav_checks: `${currentProgress.bav_checks_current}/${monthlyTargets.bav_checks_target || 0}`
    };

    // Calculate progress percentages
    const progressPercentages = {
      fa: Math.round((currentProgress.fa_current / (monthlyTargets.fa_target || 1)) * 100),
      eh: Math.round((currentProgress.eh_current / (monthlyTargets.eh_target || 1)) * 100),
      new_appointments: Math.round((currentProgress.new_appointments_current / (monthlyTargets.new_appointments_target || 1)) * 100),
      recommendations: Math.round((currentProgress.recommendations_current / (monthlyTargets.recommendations_target || 1)) * 100),
      tiv_invitations: Math.round((currentProgress.tiv_invitations_current / (monthlyTargets.tiv_invitations_target || 1)) * 100),
      taa_invitations: Math.round((currentProgress.taa_invitations_current / (monthlyTargets.taa_invitations_target || 1)) * 100),
      tgs_registrations: Math.round((currentProgress.tgs_registrations_current / (monthlyTargets.tgs_registrations_target || 1)) * 100),
      bav_checks: Math.round((currentProgress.bav_checks_current / (monthlyTargets.bav_checks_target || 1)) * 100)
    };

    return NextResponse.json({
      success: true,
      message: 'Dashboard display test completed',
      user: {
        name: user.name,
        clerk_id: user.clerk_id
      },
      monthlyTargets: monthlyTargets,
      currentProgress: currentProgress,
      dashboardDisplay: dashboardDisplay,
      progressPercentages: progressPercentages,
      testResult: {
        hasExactTargets: Object.keys(monthlyTargets).length > 0,
        noMoreRounding: true,
        displayFormat: "Current/ExactTarget (e.g., 15/22, not 15/110)",
        status: "READY FOR TESTING"
      }
    });
  } catch (error) {
    console.error('Error in test-dashboard-display:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
