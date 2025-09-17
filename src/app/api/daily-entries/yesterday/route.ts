import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

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

    // Calculate yesterday's date based on TODAY (not the provided date)
    // This ensures we always get yesterday relative to the current day
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log('Yesterday API - Today:', today.toISOString().split('T')[0]);
    console.log('Yesterday API - Yesterday:', yesterdayStr);

    // Fetch yesterday's daily entry
    const { data: yesterdayEntry, error: yesterdayError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', yesterdayStr)
      .single();

    console.log('Yesterday API - User ID:', user.id);
    console.log('Yesterday API - Yesterday date:', yesterdayStr);
    console.log('Yesterday API - Raw entry from DB:', yesterdayEntry);
    console.log('Yesterday API - Error:', yesterdayError);

    if (yesterdayError && yesterdayError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching yesterday entry:', yesterdayError);
      return NextResponse.json({ error: 'Failed to fetch yesterday entry', details: yesterdayError.message }, { status: 500 });
    }

    // Format the data for the Berater page
    const formattedData = {
      yesterdayGoals: {
        fa_target: yesterdayEntry?.today_goals?.fa_target || 0,
        eh_target: yesterdayEntry?.today_goals?.eh_target || 0,
        new_appointments_target: yesterdayEntry?.today_goals?.new_appointments_target || 0,
        recommendations_target: yesterdayEntry?.today_goals?.recommendations_target || 0,
        tiv_invitations_target: yesterdayEntry?.today_goals?.tiv_invitations_target || 0,
        taa_invitations_target: yesterdayEntry?.today_goals?.taa_invitations_target || 0,
        tgs_registrations_target: yesterdayEntry?.today_goals?.tgs_registrations_target || 0,
        bav_checks_target: yesterdayEntry?.today_goals?.bav_checks_target || 0
      },
      yesterdayTodos: yesterdayEntry?.today_todos || [],
      yesterdayResults: {
        fa_achieved: yesterdayEntry?.fa_count || 0,
        eh_achieved: yesterdayEntry?.eh_count || 0,
        new_appointments_achieved: yesterdayEntry?.new_appointments || 0,
        recommendations_achieved: yesterdayEntry?.recommendations || 0,
        tiv_invitations_achieved: yesterdayEntry?.tiv_invitations || 0,
        taa_invitations_achieved: yesterdayEntry?.taa_invitations || 0,
        tgs_registrations_achieved: yesterdayEntry?.tgs_registrations || 0,
        bav_checks_achieved: yesterdayEntry?.bav_checks || 0,
        todos_completed: yesterdayEntry?.todos_completed || [false, false, false, false, false],
        highlight_yesterday: yesterdayEntry?.highlight_yesterday || '',
        appointments_next_week: yesterdayEntry?.appointments_next_week || 0,
        improvement_today: yesterdayEntry?.improvement_today || '',
        weekly_improvement: yesterdayEntry?.weekly_improvement || '',
        charisma_training: yesterdayEntry?.charisma_training || false
      }
    };

    console.log('Yesterday API - Raw entry:', yesterdayEntry);
    console.log('Yesterday API - Formatted data:', formattedData);

    return NextResponse.json({ 
      success: true, 
      data: formattedData,
      date: yesterdayStr 
    });
  } catch (error) {
    console.error('Error in GET /api/daily-entries/yesterday:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
