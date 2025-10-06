import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Service role key not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { event_id, event_date } = await request.json();

    if (!event_id || !event_date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID and date are required' 
      }, { status: 400 });
    }

    // Get current user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get speaker info
    const { data: speaker, error: speakerError } = await supabase
      .from('speakers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (speakerError || !speaker) {
      console.error('Speaker not found:', speakerError);
      return NextResponse.json({ 
        success: false, 
        error: 'Speaker not found. Please register as a speaker first.' 
      }, { status: 404 });
    }

    // Check if slot is already booked
    const { data: existingBooking, error: checkError } = await supabase
      .from('speaker_bookings')
      .select('id')
      .eq('event_id', event_id)
      .eq('event_date', event_date)
      .eq('status', 'confirmed')
      .single();

    if (existingBooking) {
      return NextResponse.json({ 
        success: false, 
        error: 'This slot is already booked' 
      }, { status: 409 });
    }

    // Create new booking using service role (bypasses RLS)
    const { data: newBooking, error: bookingError } = await supabase
      .from('speaker_bookings')
      .insert({
        event_id,
        speaker_id: speaker.id,
        event_date,
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error creating booking',
        debug: {
          bookingError: bookingError.message,
          event_id,
          speaker_id: speaker.id,
          event_date
        }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: newBooking 
    });

  } catch (error) {
    console.error('Error in speaker-bookings-service API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
