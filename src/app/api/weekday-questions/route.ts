import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get weekday from query parameter or use current weekday
    const { searchParams } = new URL(request.url);
    const weekdayParam = searchParams.get('weekday');
    const currentWeekday = weekdayParam ? parseInt(weekdayParam) : (new Date().getDay() || 7);

    const { data: weekdayQuestion, error } = await supabase
      .from('weekday_questions')
      .select('*')
      .eq('weekday', currentWeekday)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching weekday questions:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // If no question found in database, return default questions
    if (!weekdayQuestion) {
      const defaultQuestions = {
        weekday: currentWeekday,
        yesterday_question: "Was sind deine drei Diamanten von den Samstagsschulungen?",
        today_questions: [
          "Wobei brauchst du heute Hilfe?",
          "Was willst du heute trainieren?", 
          "Was willst du heute noch besser machen?",
          "Welche Beratungen sollen diese Woche durchgesprochen werden?"
        ],
        trainee_question: "Ein großer Test"
      };
      return NextResponse.json(defaultQuestions);
    }

    // Ensure today_questions is always an array
    const response = {
      ...weekdayQuestion,
      today_questions: typeof weekdayQuestion.today_questions === 'string'
        ? JSON.parse(weekdayQuestion.today_questions)
        : weekdayQuestion.today_questions
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/weekday-questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
