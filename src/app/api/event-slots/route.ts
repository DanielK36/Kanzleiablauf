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
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('event_id');

    if (!eventId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID is required' 
      }, { status: 400 });
    }

    // Get the recurring event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('is_recurring', true)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event not found or not recurring' 
      }, { status: 404 });
    }

    // Generate slots for the next 12 weeks
    const slots = generateRecurringSlots(event);
    
    // Get existing bookings for this event
    const { data: bookings, error: bookingsError } = await supabase
      .from('speaker_bookings')
      .select(`
        id,
        event_date,
        status,
        speakers (
          id,
          first_name,
          last_name
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
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
      .select('id, first_name, last_name')
      .eq('email', user.email)
      .single();

    if (speakerError || !speaker) {
      console.error('Speaker not found:', speakerError);
      return NextResponse.json({ 
        success: false, 
        error: 'Speaker not found' 
      }, { status: 404 });
    }

    // Mark slots as booked or available
    const slotsWithStatus = slots.map(slot => {
      const booking = bookings?.find(b => b.event_date === slot.date);
      const isMyBooking = speaker && booking?.speakers?.id === speaker.id;
      
      return {
        event_id: eventId,
        date: slot.date,
        is_available: !booking,
        speaker_name: booking?.speakers ? 
          `${booking.speakers.first_name} ${booking.speakers.last_name}` : 
          undefined,
        speaker_id: booking?.speakers?.id,
        is_my_booking: isMyBooking
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: slotsWithStatus 
    });

  } catch (error) {
    console.error('Error in event-slots API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

function generateRecurringSlots(event: any) {
  const slots = [];
  const startDate = new Date(event.event_date);
  const recurrenceDays = event.recurrence_days || [1]; // Default to Monday
  const recurrenceInterval = event.recurrence_interval || 1;
  const endDate = event.recurrence_end_date ? new Date(event.recurrence_end_date) : null;
  
  // Generate slots for the next 12 weeks
  const maxWeeks = 12;
  let currentDate = new Date();
  
  for (let week = 0; week < maxWeeks; week++) {
    const weekDate = new Date(currentDate);
    weekDate.setDate(currentDate.getDate() + (week * 7));
    
    // Check each recurrence day
    for (const dayNumber of recurrenceDays) {
      const slotDate = new Date(weekDate);
      const dayDiff = dayNumber - slotDate.getDay();
      slotDate.setDate(slotDate.getDate() + dayDiff);
      
      // Skip if before today
      if (slotDate < new Date()) continue;
      
      // Skip if after end date
      if (endDate && slotDate > endDate) continue;
      
      slots.push({
        date: slotDate.toISOString().split('T')[0]
      });
    }
  }
  
  return slots.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}