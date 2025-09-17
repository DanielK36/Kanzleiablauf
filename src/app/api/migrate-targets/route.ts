import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('personal_targets, monthly_targets')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if monthly_targets already exists and has values
    if (user.monthly_targets && Object.keys(user.monthly_targets).length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Monthly targets already exist',
        monthlyTargets: user.monthly_targets
      });
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
      .eq('clerk_id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to migrate targets', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Targets migrated successfully',
      personalTargets: personalTargets,
      monthlyTargets: monthlyTargets,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in migrate-targets:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
