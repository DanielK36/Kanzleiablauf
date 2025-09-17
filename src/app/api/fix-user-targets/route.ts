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

    // Update user with proper default targets
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
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
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating user targets:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update user targets', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User targets updated successfully',
      user: updatedUser,
      newTargets: {
        fa_daily: 5,
        eh_daily: 3,
        new_appointments_daily: 3,
        recommendations_daily: 2,
        tiv_invitations_daily: 1,
        taa_invitations_daily: 1,
        tgs_registrations_daily: 1,
        bav_checks_daily: 2
      }
    });
  } catch (error) {
    console.error('Error in fix-user-targets:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
