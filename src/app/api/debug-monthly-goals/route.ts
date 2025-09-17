import { NextResponse } from 'next/server';
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
      .select('*')
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
        .select('*')
        .single();

      if (createError || !newUser) {
        return NextResponse.json({ 
          error: 'Failed to create user', 
          details: createError?.message 
        }, { status: 500 });
      }
      
      user = newUser;
    }

    // Check if monthly goal update is needed
    const today = new Date();
    const dayOfMonth = today.getDate();
    const lastUpdate = user.last_monthly_goal_update ? new Date(user.last_monthly_goal_update) : null;
    const needsUpdate = dayOfMonth >= 28 && (!lastUpdate || lastUpdate.getMonth() !== today.getMonth());

    return NextResponse.json({ 
      success: true, 
      needsMonthlyGoalUpdate: needsUpdate,
      currentGoals: user.personal_targets,
      lastUpdate: user.last_monthly_goal_update,
      debug: {
        userId: userId,
        userExists: !!user,
        dayOfMonth: dayOfMonth,
        lastUpdateMonth: lastUpdate?.getMonth(),
        currentMonth: today.getMonth(),
        userData: user
      }
    });
  } catch (error) {
    console.error('Error in debug-monthly-goals:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
