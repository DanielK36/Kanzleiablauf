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

    // First, check current targets
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Current targets:', currentUser.personal_targets);

    // Check if all targets are zero
    const allZero = currentUser.personal_targets ? 
      Object.values(currentUser.personal_targets).every(value => value === 0) : true;

    if (!allZero) {
      return NextResponse.json({
        success: true,
        message: 'Targets are already set correctly',
        currentTargets: currentUser.personal_targets
      });
    }

    // Set realistic targets
    const newTargets = {
      fa_daily: 5,
      eh_daily: 3,
      new_appointments_daily: 3,
      recommendations_daily: 2,
      tiv_invitations_daily: 1,
      taa_invitations_daily: 1,
      tgs_registrations_daily: 1,
      bav_checks_daily: 2
    };

    // Update targets
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        personal_targets: newTargets,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update targets', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Targets updated successfully',
      oldTargets: currentUser.personal_targets,
      newTargets: newTargets,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error in fix-targets-now:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
