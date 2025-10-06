import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Test if tables exist
    const { data: bookingsTest, error: bookingsError } = await supabase
      .from('speaker_bookings')
      .select('id')
      .limit(1);

    const { data: subscriptionsTest, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .limit(1);

    // Test if speakers table exists and has data
    const { data: speakersTest, error: speakersError } = await supabase
      .from('speakers')
      .select('id, first_name, last_name, email')
      .limit(5);

    return NextResponse.json({ 
      success: true, 
      data: {
        speaker_bookings_exists: !bookingsError,
        push_subscriptions_exists: !subscriptionsError,
        speakers_count: speakersTest?.length || 0,
        speakers_data: speakersTest || [],
        bookings_error: bookingsError?.message,
        subscriptions_error: subscriptionsError?.message,
        speakers_error: speakersError?.message
      }
    });

  } catch (error) {
    console.error('Error in debug-tables API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
