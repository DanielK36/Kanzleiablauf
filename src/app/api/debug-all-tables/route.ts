import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Test events table
    const { data: eventsTest, error: eventsError } = await supabase
      .from('events')
      .select('id, title, is_recurring, recurrence_days')
      .limit(5);

    // Test speakers table
    const { data: speakersTest, error: speakersError } = await supabase
      .from('speakers')
      .select('id, first_name, last_name, email')
      .limit(5);

    // Test users table
    const { data: usersTest, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, clerk_id')
      .limit(5);

    return NextResponse.json({ 
      success: true, 
      data: {
        events_count: eventsTest?.length || 0,
        events_data: eventsTest || [],
        events_error: eventsError?.message,
        speakers_count: speakersTest?.length || 0,
        speakers_data: speakersTest || [],
        speakers_error: speakersError?.message,
        users_count: usersTest?.length || 0,
        users_data: usersTest || [],
        users_error: usersError?.message
      }
    });

  } catch (error) {
    console.error('Error in debug-all-tables API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
