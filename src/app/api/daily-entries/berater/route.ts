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
    const { 
      yesterdayResults, 
      todayGoals, 
      todayTodos, 
      todayAnswers,
      weekdayAnswers,
      weekday_answers,
      entryDate 
    } = body;

    console.log('Berater API - Received data:', {
      entryDate,
      yesterdayResults: yesterdayResults ? 'present' : 'missing',
      todayGoals: todayGoals ? 'present' : 'missing',
      todayAnswers: todayAnswers ? 'present' : 'missing'
    });

    const supabase = createSupabaseServerClient();

    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found', details: userError?.message }, { status: 404 });
    }

    const date = entryDate || new Date().toISOString().split('T')[0];
    console.log('Berater API - Using date:', date);

    // Save daily entry - all data including todos and questions
    const { data: dailyEntry, error: dailyError } = await supabase
      .from('daily_entries')
      .upsert({
        user_id: user.id,
        entry_date: date,
        // Yesterday's results
        fa_count: yesterdayResults.fa_achieved,
        eh_count: yesterdayResults.eh_achieved,
        new_appointments: yesterdayResults.new_appointments_achieved,
        recommendations: yesterdayResults.recommendations_achieved,
        tiv_invitations: yesterdayResults.tiv_invitations_achieved,
        taa_invitations: yesterdayResults.taa_invitations_achieved,
        tgs_registrations: yesterdayResults.tgs_registrations_achieved,
        bav_checks: yesterdayResults.bav_checks_achieved,
        // Yesterday's todos and questions
        todos_completed: yesterdayResults.todos_completed,
        highlight_yesterday: yesterdayResults.highlight_yesterday,
        appointments_next_week: yesterdayResults.appointments_next_week,
        improvement_today: yesterdayResults.improvement_today,
        weekly_improvement: yesterdayResults.weekly_improvement,
        charisma_training: yesterdayResults.charisma_training,
        // Today's goals and todos
        today_goals: todayGoals,
        today_todos: todayTodos,
        // Today's questions
        help_needed: todayAnswers.help_needed,
        training_focus: todayAnswers.training_focus,
        improvement_today: todayAnswers.improvement_today,
        // Weekday answers
        weekday_answers: weekday_answers || weekdayAnswers,
        weekday_answer: todayAnswers.weekday_answer,
        // weekly_improvement is stored in yesterdayResults for Friday
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,entry_date' })
      .select()
      .single();

    if (dailyError) {
      console.error('Error saving daily entry:', dailyError);
      return NextResponse.json({ error: 'Failed to save daily entry', details: dailyError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tageseintrag erfolgreich gespeichert!',
      data: dailyEntry 
    });
  } catch (error) {
    console.error('Error in POST /api/daily-entries/berater:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
