import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

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

    const { data, error } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching today entry:', error);
      return NextResponse.json({ error: 'Failed to fetch today entry' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        success: true, 
        data: null,
        message: 'No entry found for today' 
      });
    }

    // Transform the data to match expected format
    const transformedData = {
      todayGoals: data.today_goals || {},
      todayAnswers: {
        help_needed: data.help_needed || '',
        training_focus: data.training_focus || '',
        improvement_today: data.improvement_today || '',
        weekday_answer: data.weekday_answer || ''
      },
      weekdayAnswers: data.weekday_answers || {},
      todayTodos: data.today_todos || [],
      // Include yesterday's results that were entered today - only if they exist
      yesterdayResults: data.fa_count !== null || data.eh_count !== null || data.new_appointments !== null || 
                       data.recommendations !== null || data.tiv_invitations !== null || 
                       data.taa_invitations !== null || data.tgs_registrations !== null || 
                       data.bav_checks !== null || data.highlight_yesterday !== null || 
                       data.appointments_next_week !== null ? {
        fa_achieved: data.fa_count || 0,
        eh_achieved: data.eh_count || 0,
        new_appointments_achieved: data.new_appointments || 0,
        recommendations_achieved: data.recommendations || 0,
        tiv_invitations_achieved: data.tiv_invitations || 0,
        taa_invitations_achieved: data.taa_invitations || 0,
        tgs_registrations_achieved: data.tgs_registrations || 0,
        bav_checks_achieved: data.bav_checks || 0,
        todos_completed: data.todos_completed || [false, false, false, false, false],
        highlight_yesterday: data.highlight_yesterday || '',
        appointments_next_week: data.appointments_next_week || 0,
        improvement_today: data.improvement_today || '',
        weekly_improvement: data.weekly_improvement || '',
        charisma_training: data.charisma_training || false
      } : null
    };

    return NextResponse.json({ 
      success: true, 
      data: transformedData,
      rawEntry: data, // Include raw data for yesterday's results
      message: 'Today entry loaded successfully' 
    });
  } catch (error) {
    console.error('Error in GET /api/daily-entries/today:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
