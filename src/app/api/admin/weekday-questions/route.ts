import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Get all weekday questions
    const { data: questions, error } = await supabase
      .from('weekday_questions')
      .select('*')
      .order('weekday');

    if (error) {
      console.error('Error fetching weekday questions:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    // Ensure all question fields are properly formatted for frontend
    const processedQuestions = questions?.map(q => ({
      ...q,
      yesterday_question: typeof q.yesterday_question === 'string' 
        ? (q.yesterday_question.startsWith('[') ? JSON.parse(q.yesterday_question) : [q.yesterday_question])
        : (Array.isArray(q.yesterday_question) ? q.yesterday_question : []),
      today_questions: typeof q.today_questions === 'string' 
        ? JSON.parse(q.today_questions) 
        : q.today_questions,
      trainee_question: typeof q.trainee_question === 'string' 
        ? (q.trainee_question.startsWith('[') ? JSON.parse(q.trainee_question) : [q.trainee_question])
        : (Array.isArray(q.trainee_question) ? q.trainee_question : [])
    })) || [];

    return NextResponse.json(processedQuestions);
  } catch (error) {
    console.error('Error in GET /api/admin/weekday-questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = createSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, weekday, yesterday_question, today_questions, trainee_question } = body;

    if (!weekday) {
      return NextResponse.json({ error: 'Missing weekday field' }, { status: 400 });
    }

    // Format questions - only convert to JSON if it's actually an array with multiple items
    const formattedYesterdayQuestion = Array.isArray(yesterday_question) 
      ? (yesterday_question.length > 1 ? JSON.stringify(yesterday_question) : yesterday_question[0] || '')
      : yesterday_question;
    const formattedTraineeQuestion = Array.isArray(trainee_question) 
      ? (trainee_question.length > 1 ? JSON.stringify(trainee_question) : trainee_question[0] || '')
      : trainee_question;

    let result;
    if (id) {
      // Update existing question
      const { data, error } = await supabase
        .from('weekday_questions')
        .update({
          weekday,
          yesterday_question: formattedYesterdayQuestion,
          today_questions,
          trainee_question: formattedTraineeQuestion,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      result = data;
      if (error) throw error;
    } else {
      // Insert new question
      const { data, error } = await supabase
        .from('weekday_questions')
        .insert({
          weekday,
          yesterday_question: formattedYesterdayQuestion,
          today_questions,
          trainee_question: formattedTraineeQuestion
        })
        .select()
        .single();
      result = data;
      if (error) throw error;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/admin/weekday-questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = createSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing question ID' }, { status: 400 });
    }

    // Delete weekday question
    const { error } = await supabase
      .from('weekday_questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting weekday question:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/weekday-questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
