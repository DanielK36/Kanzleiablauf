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
    const limit = searchParams.get('limit') || '10';
    const upcoming = searchParams.get('upcoming') === 'true';

    let query = supabase
      .from('events')
      .select(`
        *,
        event_speakers (
          id,
          role,
          topic,
          is_confirmed,
          speakers (
            id,
            first_name,
            last_name
          )
        )
      `)
      .order('event_date', { ascending: true });

    if (upcoming) {
      query = query.gte('event_date', new Date().toISOString().split('T')[0]);
    }

    if (limit !== 'all') {
      query = query.limit(parseInt(limit));
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: events || [] 
    });

  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

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

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const eventData = await request.json();

    // Normalize and validate payload
    const normalized = {
      ...eventData,
      event_date: eventData.event_date && String(eventData.event_date).trim() !== '' ? eventData.event_date : null,
      recurrence_end_date: eventData.recurrence_end_date && String(eventData.recurrence_end_date).trim() !== '' ? eventData.recurrence_end_date : null,
      start_time: eventData.start_time && String(eventData.start_time).trim() !== '' ? eventData.start_time : null,
      end_time: eventData.end_time && String(eventData.end_time).trim() !== '' ? eventData.end_time : null,
    } as any;

    if (!normalized.event_date) {
      return NextResponse.json({ success: false, error: 'event_date is required' }, { status: 400 });
    }

    const { data: newEvent, error } = await supabase
      .from('events')
      .insert({
        ...normalized,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: newEvent 
    });

  } catch (error) {
    console.error('Error in events POST API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { id, ...eventData } = await request.json();

    // Normalize update payload as well
    const normalized = {
      ...eventData,
      event_date: eventData.event_date && String(eventData.event_date).trim() !== '' ? eventData.event_date : null,
      recurrence_end_date: eventData.recurrence_end_date && String(eventData.recurrence_end_date).trim() !== '' ? eventData.recurrence_end_date : null,
      start_time: eventData.start_time && String(eventData.start_time).trim() !== '' ? eventData.start_time : null,
      end_time: eventData.end_time && String(eventData.end_time).trim() !== '' ? eventData.end_time : null,
    } as any;

    if (!normalized.event_date) {
      return NextResponse.json({ success: false, error: 'event_date is required' }, { status: 400 });
    }

    const { data: updatedEvent, error } = await supabase
      .from('events')
      .update(normalized)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedEvent 
    });

  } catch (error) {
    console.error('Error in events PUT API:', error);
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

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Event ID required' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });

  } catch (error) {
    console.error('Error in events DELETE API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
