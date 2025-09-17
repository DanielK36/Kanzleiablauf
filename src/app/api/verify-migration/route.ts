import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Get all users with their targets
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('clerk_id, personal_targets, monthly_targets, name')
      .not('personal_targets', 'is', null);

    if (userError) {
      return NextResponse.json({ error: 'Failed to fetch users', details: userError.message }, { status: 500 });
    }

    const results = (users || []).map(user => ({
      name: user.name,
      clerk_id: user.clerk_id,
      hasPersonalTargets: !!user.personal_targets,
      hasMonthlyTargets: !!user.monthly_targets,
      personalTargets: user.personal_targets,
      monthlyTargets: user.monthly_targets,
      // Example calculation check
      faCalculation: {
        daily: user.personal_targets?.fa_daily || 0,
        monthlyCalculated: (user.personal_targets?.fa_daily || 0) * 22,
        monthlyStored: user.monthly_targets?.fa_target || 0
      }
    }));

    return NextResponse.json({
      success: true,
      message: 'Migration verification completed',
      totalUsers: users?.length || 0,
      results: results
    });
  } catch (error) {
    console.error('Error in verify-migration:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
