import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Get current week start (Monday)
    const currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1);
    const currentWeekStartStr = currentWeekStart.toISOString().split('T')[0];

    // Get all users
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, role, personal_targets');

    // Get all weekly goals
    const { data: allWeeklyGoals, error: allWeeklyGoalsError } = await supabase
      .from('weekly_goals')
      .select('*')
      .order('week_start_date', { ascending: false });

    // Get weekly goals for current week
    const { data: currentWeekGoals, error: currentWeekGoalsError } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('week_start_date', currentWeekStartStr);

    return NextResponse.json({
      success: true,
      debug: {
        currentWeekStartStr,
        currentDate: new Date().toISOString().split('T')[0],
        users: users?.map(u => ({ id: u.id, name: u.name, personal_targets: u.personal_targets })) || [],
        allWeeklyGoals: allWeeklyGoals || [],
        currentWeekGoals: currentWeekGoals || [],
        allWeeklyGoalsCount: allWeeklyGoals?.length || 0,
        currentWeekGoalsCount: currentWeekGoals?.length || 0,
        errors: {
          userError,
          allWeeklyGoalsError,
          currentWeekGoalsError
        }
      }
    });

  } catch (error) {
    console.error('Error in debug-weekly-goals:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
