import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Get all users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, clerk_id, personal_targets, monthly_targets')
      .not('personal_targets', 'is', null);

    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch users', details: userError.message }, { status: 500 });
    }

    const results = [];

    for (const user of users || []) {
      // Check if monthly_targets already exists and has values
      if (user.monthly_targets && Object.keys(user.monthly_targets).length > 0) {
        results.push({
          clerk_id: user.clerk_id,
          status: 'already_migrated',
          monthlyTargets: user.monthly_targets
        });
        continue;
      }

      // Calculate monthly targets from daily targets
      const personalTargets = user.personal_targets || {};
      const monthlyTargets = {
        fa_target: (personalTargets.fa_daily || 5) * 22,
        eh_target: (personalTargets.eh_daily || 3) * 22,
        new_appointments_target: (personalTargets.new_appointments_daily || 3) * 22,
        recommendations_target: (personalTargets.recommendations_daily || 2) * 22,
        tiv_invitations_target: (personalTargets.tiv_invitations_daily || 1) * 22,
        taa_invitations_target: (personalTargets.taa_invitations_daily || 1) * 22,
        tgs_registrations_target: (personalTargets.tgs_registrations_daily || 1) * 22,
        bav_checks_target: (personalTargets.bav_checks_daily || 2) * 22
      };

      // Update user with monthly targets
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          monthly_targets: monthlyTargets,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        results.push({
          clerk_id: user.clerk_id,
          status: 'error',
          error: updateError.message
        });
      } else {
        results.push({
          clerk_id: user.clerk_id,
          status: 'migrated',
          personalTargets: personalTargets,
          monthlyTargets: monthlyTargets
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results: results,
      totalUsers: users?.length || 0
    });
  } catch (error) {
    console.error('Error in migrate-targets-test:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
