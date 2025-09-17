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
    console.log('Received weekly goals data:', body);

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

    // Calculate week start date (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, so 6 days to Monday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    // Check if weekly goals already exist for this user and week
    const { data: existingGoal, error: checkError } = await supabase
      .from('weekly_goals')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start_date', weekStartDate)
      .single();

    let weeklyGoal, error;

    if (checkError && checkError.code === 'PGRST116') {
      // No existing record found, insert new one
      const { data: insertData, error: insertError } = await supabase
        .from('weekly_goals')
        .insert({
          user_id: user.id,
          week_start_date: weekStartDate,
          fa_weekly_target: body.fa_weekly_target || 0,
          eh_weekly_target: body.eh_weekly_target || 0,
          new_appointments_weekly_target: body.new_appointments_weekly_target || 0,
          recommendations_weekly_target: body.recommendations_weekly_target || 0,
          tiv_invitations_weekly_target: body.tiv_invitations_weekly_target || 0,
          taa_invitations_weekly_target: body.taa_invitations_weekly_target || 0,
          tgs_registrations_weekly_target: body.tgs_registrations_weekly_target || 0,
          bav_checks_weekly_target: body.bav_checks_weekly_target || 0,
          additional_goal: body.additional_goal || '',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      weeklyGoal = insertData;
      error = insertError;
    } else if (!checkError && existingGoal) {
      // Record exists, update it
      const { data: updateData, error: updateError } = await supabase
        .from('weekly_goals')
        .update({
          fa_weekly_target: body.fa_weekly_target || 0,
          eh_weekly_target: body.eh_weekly_target || 0,
          new_appointments_weekly_target: body.new_appointments_weekly_target || 0,
          recommendations_weekly_target: body.recommendations_weekly_target || 0,
          tiv_invitations_weekly_target: body.tiv_invitations_weekly_target || 0,
          taa_invitations_weekly_target: body.taa_invitations_weekly_target || 0,
          tgs_registrations_weekly_target: body.tgs_registrations_weekly_target || 0,
          bav_checks_weekly_target: body.bav_checks_weekly_target || 0,
          additional_goal: body.additional_goal || '',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartDate)
        .select()
        .single();
      
      weeklyGoal = updateData;
      error = updateError;
    } else {
      // Some other error occurred during check
      weeklyGoal = null;
      error = checkError;
    }

    console.log('Supabase response:', { data: weeklyGoal, error });

    if (error) {
      console.error('Error creating/updating weekly goals:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json(weeklyGoal);
  } catch (error) {
    console.error('Error in POST /api/weekly-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('week_start');

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

    let query = supabase
      .from('weekly_goals')
      .select('*')
      .eq('user_id', user.id);

    if (weekStart) {
      query = query.eq('week_start_date', weekStart);
    } else {
      // Get current week's goals
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStartDate = new Date(today);
      weekStartDate.setDate(today.getDate() - daysToMonday);
      query = query.eq('week_start_date', weekStartDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('week_start_date', { ascending: false });

    if (error) {
      console.error('Error fetching weekly goals:', error);
      return NextResponse.json({ error: 'Failed to fetch weekly goals' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/weekly-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}