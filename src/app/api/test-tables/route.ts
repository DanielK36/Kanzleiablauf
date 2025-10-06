import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Test if speaker_bookings table exists
    const { data: bookingsTest, error: bookingsError } = await supabase
      .from('speaker_bookings')
      .select('id')
      .limit(1);

    if (bookingsError) {
      console.log('speaker_bookings table does not exist:', bookingsError.message);
    }

    // Test if push_subscriptions table exists
    const { data: subscriptionsTest, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .limit(1);

    if (subscriptionsError) {
      console.log('push_subscriptions table does not exist:', subscriptionsError.message);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        speaker_bookings_exists: !bookingsError,
        push_subscriptions_exists: !subscriptionsError,
        bookings_error: bookingsError?.message,
        subscriptions_error: subscriptionsError?.message
      }
    });

  } catch (error) {
    console.error('Error in test-tables API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
