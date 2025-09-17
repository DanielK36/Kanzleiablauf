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
    console.log('Completing onboarding with:', body);

    const supabase = createSupabaseServerClient();

    // Convert monthly targets to daily targets (same logic as onboarding)
    const personalTargets = {
      fa_daily: Math.round(body.monthlyTargets.fa_target / 22),
      eh_daily: Math.round(body.monthlyTargets.eh_target / 22),
      new_appointments_daily: Math.round(body.monthlyTargets.new_appointments_target / 22),
      recommendations_daily: Math.round(body.monthlyTargets.recommendations_target / 22),
      tiv_invitations_daily: Math.round(body.monthlyTargets.tiv_invitations_target / 22),
      taa_invitations_daily: Math.round(body.monthlyTargets.taa_invitations_target / 22),
      tgs_registrations_daily: Math.round(body.monthlyTargets.tgs_registrations_target / 22),
      bav_checks_daily: Math.round(body.monthlyTargets.bav_checks_target / 22)
    };

    console.log('Converted personal targets:', personalTargets);

    // Update user with onboarding data
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .upsert({
        clerk_id: userId,
        email: body.email || 'user@example.com',
        name: body.name || 'Test User',
        team_name: body.teamName || 'Test Team',
        role: body.role || 'advisor',
        personal_targets: personalTargets,
        consent_given: true,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'clerk_id' })
      .select()
      .single();

    console.log('Onboarding update response:', { data: updatedUser, error: updateError });

    if (updateError) {
      console.error('Error completing onboarding:', updateError);
      return NextResponse.json({ 
        error: 'Failed to complete onboarding', 
        details: updateError.message,
        code: updateError.code,
        hint: updateError.hint
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      user: updatedUser,
      personalTargets: personalTargets,
      monthlyTargets: body.monthlyTargets
    });
  } catch (error) {
    console.error('Error in complete-onboarding:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
