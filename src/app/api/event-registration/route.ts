import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const { eventIds } = await request.json();

    if (!eventIds || !Array.isArray(eventIds)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event IDs required' 
      }, { status: 400 });
    }

    const registrations = [];

    for (const eventId of eventIds) {
      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      if (!existingRegistration) {
        const { data: registration, error } = await supabase
          .from('event_registrations')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status: 'registered'
          })
          .select()
          .single();

        if (error) {
          console.error('Error registering for event:', error);
          continue;
        }

        registrations.push(registration);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: registrations,
      message: `Successfully registered for ${registrations.length} events`
    });

  } catch (error) {
    console.error('Error in event registration API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

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

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const { data: registrations, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events (
          id,
          title,
          event_date,
          start_time,
          end_time,
          location
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: registrations || [] 
    });

  } catch (error) {
    console.error('Error in event registration GET API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
