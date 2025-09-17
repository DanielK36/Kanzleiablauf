import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    // Get user data
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, personal_targets')
      .eq('clerk_id', userId)
      .single();

    // If user not found, create a default user
    if (userError || !user) {
      console.log('User not found, creating default user:', userId);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .upsert({
          clerk_id: userId,
          email: 'user@example.com',
          name: 'Test User',
          team_name: 'Test Team',
          role: 'advisor',
          personal_targets: {
            fa_daily: 5,
            eh_daily: 3,
            new_appointments_daily: 3,
            recommendations_daily: 2,
            tiv_invitations_daily: 2,
            taa_invitations_daily: 1,
            tgs_registrations_daily: 1,
            bav_checks_daily: 2
          },
          consent_given: true,
          consent_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'clerk_id' })
        .select('id, personal_targets')
        .single();

      if (createError || !newUser) {
        return NextResponse.json({ 
          error: 'Failed to create user', 
          details: createError?.message 
        }, { status: 500 });
      }
      
      user = newUser;
    }

    // Check if monthly goal update is needed (28th of month or first time)
    const today = new Date();
    const dayOfMonth = today.getDate();
    // For now, always return false for needsUpdate since we don't have the column
    const needsUpdate = false; // dayOfMonth >= 28;

    return NextResponse.json({ 
      success: true, 
      needsMonthlyGoalUpdate: needsUpdate,
      currentGoals: user.personal_targets,
      lastUpdate: null // Not available without the column
    });
  } catch (error) {
    console.error('Error in GET /api/monthly-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { monthlyTargets } = body;

    const supabase = createSupabaseServerClient();

    // Convert monthly targets to daily targets
    const personalTargets = {
      fa_daily: Math.round(monthlyTargets.fa_target / 22),
      eh_daily: Math.round(monthlyTargets.eh_target / 22),
      new_appointments_daily: Math.round(monthlyTargets.new_appointments_target / 22),
      recommendations_daily: Math.round(monthlyTargets.recommendations_target / 22),
      tiv_invitations_daily: Math.round(monthlyTargets.tiv_invitations_target / 22),
      taa_invitations_daily: Math.round(monthlyTargets.taa_invitations_target / 22),
      tgs_registrations_daily: Math.round(monthlyTargets.tgs_registrations_target / 22),
      bav_checks_daily: Math.round(monthlyTargets.bav_checks_target / 22)
    };

    // Update user with new targets
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        personal_targets: personalTargets,
        updated_at: new Date().toISOString()
      })
      .eq('clerk_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating monthly goals:', updateError);
      return NextResponse.json({ error: 'Failed to update monthly goals' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Monthly goals updated successfully',
      personalTargets 
    });
  } catch (error) {
    console.error('Error in POST /api/monthly-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
