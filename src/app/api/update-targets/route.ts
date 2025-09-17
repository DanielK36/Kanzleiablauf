import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Updating targets with:', body);

    const supabase = createSupabaseServerClient();

    // Convert monthly targets to daily targets
    const personalTargets = {
      fa_daily: Math.round(body.fa_target / 22),
      eh_daily: Math.round(body.eh_target / 22),
      new_appointments_daily: Math.round(body.new_appointments_target / 22),
      recommendations_daily: Math.round(body.recommendations_target / 22),
      tiv_invitations_daily: Math.round(body.tiv_invitations_target / 22),
      taa_invitations_daily: Math.round(body.taa_invitations_target / 22),
      tgs_registrations_daily: Math.round(body.tgs_registrations_target / 22),
      bav_checks_daily: Math.round(body.bav_checks_target / 22)
    };

    console.log('Converted targets:', personalTargets);

    // Update only the personal_targets for existing user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        personal_targets: personalTargets,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    console.log('Update response:', { data: updatedUser, error: updateError });

    if (updateError) {
      console.error('Error updating targets:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update targets', 
        details: updateError.message,
        code: updateError.code
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Targets updated successfully',
      personalTargets: personalTargets,
      monthlyTargets: body
    });
  } catch (error) {
    console.error('Error in update-targets:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
