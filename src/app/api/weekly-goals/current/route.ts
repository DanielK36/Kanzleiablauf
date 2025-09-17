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
    
    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate current week's start date (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 1, Sunday = 0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    // Get current week's goal
    const { data: goal, error: goalError } = await supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartDate)
      .single();

    if (goalError && goalError.code !== 'PGRST116') {
      console.error('Error fetching current weekly goal:', goalError);
      return NextResponse.json({ error: 'Failed to fetch current weekly goal' }, { status: 500 });
    }

    return NextResponse.json({ goal: goal || null });
  } catch (error) {
    console.error('Error in GET /api/weekly-goals/current:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
