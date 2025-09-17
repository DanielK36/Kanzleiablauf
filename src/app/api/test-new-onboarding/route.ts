import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Simulate onboarding data with exact monthly targets (no rounding)
    const testOnboardingData = {
      name: 'Test User',
      team_name: 'Test Team',
      role: 'advisor',
      personal_targets: {
        fa_daily: 5,
        eh_daily: 3,
        new_appointments_daily: 3,
        recommendations_daily: 2,
        tiv_invitations_daily: 1,
        taa_invitations_daily: 1,
        tgs_registrations_daily: 1,
        bav_checks_daily: 2
      },
      monthly_targets: {
        // Exact values - no rounding!
        fa_target: 109,        // Not 110!
        eh_target: 67,         // Not 66!
        new_appointments_target: 65,  // Not 66!
        recommendations_target: 43,   // Not 44!
        tiv_invitations_target: 23,   // Not 22!
        taa_invitations_target: 21,   // Not 22!
        tgs_registrations_target: 25, // Not 22!
        bav_checks_target: 45         // Not 44!
      }
    };

    // Create/update test user
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        clerk_id: 'test_user_onboarding',
        name: testOnboardingData.name,
        team_name: testOnboardingData.team_name,
        role: testOnboardingData.role,
        personal_targets: testOnboardingData.personal_targets,
        monthly_targets: testOnboardingData.monthly_targets,
        consent_given: true,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'clerk_id' })
      .select()
      .single();

    if (userError) {
      return NextResponse.json({ 
        error: 'Failed to create test user', 
        details: userError.message 
      }, { status: 500 });
    }

    // Test the monthly progress API with this user
    const { data: monthlyProgress, error: progressError } = await supabase
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
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    // Calculate current totals (simulate some progress)
    const totals = {
      fa_current: 15,
      eh_current: 8,
      new_appointments_current: 12,
      recommendations_current: 7,
      tiv_invitations_current: 3,
      taa_invitations_current: 2,
      tgs_registrations_current: 1,
      bav_checks_current: 4
    };

    // Calculate progress percentages
    const progress = {
      fa_progress: Math.round((totals.fa_current / testOnboardingData.monthly_targets.fa_target) * 100),
      eh_progress: Math.round((totals.eh_current / testOnboardingData.monthly_targets.eh_target) * 100),
      new_appointments_progress: Math.round((totals.new_appointments_current / testOnboardingData.monthly_targets.new_appointments_target) * 100),
      recommendations_progress: Math.round((totals.recommendations_current / testOnboardingData.monthly_targets.recommendations_target) * 100),
      tiv_invitations_progress: Math.round((totals.tiv_invitations_current / testOnboardingData.monthly_targets.tiv_invitations_target) * 100),
      taa_invitations_progress: Math.round((totals.taa_invitations_current / testOnboardingData.monthly_targets.taa_invitations_target) * 100),
      tgs_registrations_progress: Math.round((totals.tgs_registrations_current / testOnboardingData.monthly_targets.tgs_registrations_target) * 100),
      bav_checks_progress: Math.round((totals.bav_checks_current / testOnboardingData.monthly_targets.bav_checks_target) * 100)
    };

    return NextResponse.json({
      success: true,
      message: 'New onboarding system test completed',
      testData: {
        input: testOnboardingData,
        user: user,
        currentTotals: totals,
        progress: progress,
        comparison: {
          fa: `${totals.fa_current}/${testOnboardingData.monthly_targets.fa_target} (${progress.fa_progress}%)`,
          eh: `${totals.eh_current}/${testOnboardingData.monthly_targets.eh_target} (${progress.eh_progress}%)`,
          new_appointments: `${totals.new_appointments_current}/${testOnboardingData.monthly_targets.new_appointments_target} (${progress.new_appointments_progress}%)`,
          recommendations: `${totals.recommendations_current}/${testOnboardingData.monthly_targets.recommendations_target} (${progress.recommendations_progress}%)`
        }
      }
    });
  } catch (error) {
    console.error('Error in test-new-onboarding:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
