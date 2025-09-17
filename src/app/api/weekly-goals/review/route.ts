import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      week_start_date,
      goal_achieved,
      completion_notes,
      next_week_focus
    } = body;

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

    // Update the weekly goal with review data
    const { data, error } = await supabase
      .from('weekly_goals')
      .update({
        is_completed: goal_achieved,
        completion_notes: completion_notes,
        next_week_focus: next_week_focus,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('week_start_date', week_start_date)
      .select()
      .single();

    if (error) {
      console.error('Error updating weekly goal:', error);
      return NextResponse.json({ error: 'Failed to update weekly goal' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in POST /api/weekly-goals/review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
