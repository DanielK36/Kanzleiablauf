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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      return NextResponse.json({ 
        error: 'User not found', 
        details: userError.message 
      }, { status: 404 });
    }

    // Check if onboarding is complete
    const hasPersonalTargets = user.personal_targets && 
      Object.values(user.personal_targets).some(value => value > 0);
    
    const hasBasicInfo = user.name && user.name !== 'Test User' && 
                         user.team_name && user.team_name !== 'Test Team';

    return NextResponse.json({
      success: true,
      onboardingComplete: hasPersonalTargets && hasBasicInfo,
      user: {
        name: user.name,
        team_name: user.team_name,
        role: user.role,
        email: user.email
      },
      personalTargets: user.personal_targets,
      hasPersonalTargets: hasPersonalTargets,
      hasBasicInfo: hasBasicInfo,
      allTargetsZero: user.personal_targets ? 
        Object.values(user.personal_targets).every(value => value === 0) : true
    });
  } catch (error) {
    console.error('Error in check-onboarding:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
