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

    // Get speaker info - try different approaches
    let speaker = null;
    
    // First try: direct match with clerk_id
    const { data: speakerByClerkId, error: clerkError } = await supabase
      .from('speakers')
      .select('id')
      .eq('email', userId)
      .single();

    if (speakerByClerkId) {
      speaker = speakerByClerkId;
    } else {
      // Second try: get user and match by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('clerk_id', userId)
        .single();

      if (user && !userError) {
        const { data: speakerByEmail, error: emailError } = await supabase
          .from('speakers')
          .select('id')
          .eq('email', user.email)
          .single();

        if (speakerByEmail) {
          speaker = speakerByEmail;
        }
      }
    }

    if (!speaker) {
      return NextResponse.json({ 
        success: false, 
        error: 'Speaker not found' 
      }, { status: 404 });
    }

    // Get speaker's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('speaker_bookings')
      .select(`
        id,
        event_id,
        event_date,
        status,
        created_at,
        events (
          id,
          title,
          start_time,
          end_time,
          location,
          event_category
        )
      `)
      .eq('speaker_id', speaker.id)
      .order('event_date', { ascending: true });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error fetching bookings' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: bookings || [] 
    });

  } catch (error) {
    console.error('Error in speaker-bookings GET API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { event_id, event_date } = await request.json();

    if (!event_id || !event_date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID and date are required' 
      }, { status: 400 });
    }

    // Get speaker info - try different approaches
    let speaker = null;
    
    // First try: direct match with clerk_id
    const { data: speakerByClerkId, error: clerkError } = await supabase
      .from('speakers')
      .select('id')
      .eq('email', userId)
      .single();

    if (speakerByClerkId) {
      speaker = speakerByClerkId;
    } else {
      // Second try: get user and match by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('clerk_id', userId)
        .single();

      if (user && !userError) {
        const { data: speakerByEmail, error: emailError } = await supabase
          .from('speakers')
          .select('id')
          .eq('email', user.email)
          .single();

        if (speakerByEmail) {
          speaker = speakerByEmail;
        }
      }
    }

    if (!speaker) {
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

    // Create new booking
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
        debug: bookingError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: newBooking 
    });

  } catch (error) {
    console.error('Error in speaker-bookings API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');

    if (!bookingId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking ID is required' 
      }, { status: 400 });
    }

    // Get speaker info - try different approaches
    let speaker = null;
    
    // First try: direct match with clerk_id
    const { data: speakerByClerkId, error: clerkError } = await supabase
      .from('speakers')
      .select('id')
      .eq('email', userId)
      .single();

    if (speakerByClerkId) {
      speaker = speakerByClerkId;
    } else {
      // Second try: get user and match by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('clerk_id', userId)
        .single();

      if (user && !userError) {
        const { data: speakerByEmail, error: emailError } = await supabase
          .from('speakers')
          .select('id')
          .eq('email', user.email)
          .single();

        if (speakerByEmail) {
          speaker = speakerByEmail;
        }
      }
    }

    if (!speaker) {
      return NextResponse.json({ 
        success: false, 
        error: 'Speaker not found' 
      }, { status: 404 });
    }

    // Delete the booking
    const { error: deleteError } = await supabase
      .from('speaker_bookings')
      .delete()
      .eq('id', bookingId)
      .eq('speaker_id', speaker.id);

    if (deleteError) {
      console.error('Error deleting booking:', deleteError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error deleting booking' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled successfully' 
    });

  } catch (error) {
    console.error('Error in speaker-bookings DELETE API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}