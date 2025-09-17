import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get only the next event of each type
    const { data: allEvents, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0]) // Only future events
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Group events by type and get only the next one of each type
    const eventsByType = new Map();
    allEvents?.forEach(event => {
      const eventType = event.custom_type && event.type === 'custom' ? event.custom_type : event.type;
      if (!eventsByType.has(eventType) || new Date(event.date) < new Date(eventsByType.get(eventType).date)) {
        eventsByType.set(eventType, event);
      }
    });

    const events = Array.from(eventsByType.values());

    return NextResponse.json({
      success: true,
      events: events || []
    });
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function ensureEventsTable(supabase: any) {
  // Test if table exists by trying a simple query
  const { error } = await supabase.from('events').select('count').limit(1);
  
  if (error && error.code === 'PGRST205') {
    // Table doesn't exist - provide clear instructions
    throw new Error('EVENTS_TABLE_MISSING');
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Check if user is a leader
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || !['top_leader', 'sub_leader'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { type, date, day, time, location, topic, isRecurring, recurringType, customType, icon } = body;

    // Ensure table exists
    try {
      await ensureEventsTable(supabase);
    } catch (tableError) {
      if (tableError.message === 'EVENTS_TABLE_MISSING') {
        return NextResponse.json({ 
          error: 'Events table not found',
          details: 'Please create the events table in your Supabase database. Run this SQL in your Supabase SQL Editor:',
          sql: `CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  day VARCHAR(20) NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(255) NOT NULL,
  topic VARCHAR(255),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type VARCHAR(20) DEFAULT 'none',
  custom_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by authenticated users" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Events are manageable by leaders" ON events
  FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role IN ('top_leader', 'sub_leader')
  ));`
        }, { status: 500 });
      }
      throw tableError;
    }

    // Create new event
    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        type: customType && type === 'custom' ? customType : type,
        date,
        day,
        time,
        location,
        topic: topic || '',
        is_recurring: isRecurring || false,
        recurring_type: recurringType || 'none',
        custom_type: customType || null,
        icon: icon || '📅'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return NextResponse.json({ 
        error: 'Failed to create event', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Check if user is a leader
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || !['top_leader', 'sub_leader'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { id, type, date, day, time, location, topic, isRecurring, recurringType, customType, icon } = body;

    // Update event
    const { data: event, error } = await supabase
      .from('events')
      .update({
        type: customType && type === 'custom' ? customType : type,
        date,
        day,
        time,
        location,
        topic: topic || '',
        is_recurring: isRecurring || false,
        recurring_type: recurringType || 'none',
        custom_type: customType || null,
        icon: icon || '📅',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return NextResponse.json({ 
        error: 'Failed to update event', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error in PUT /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Check if user is a leader
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || !['top_leader', 'sub_leader'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Delete event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting event:', error);
      return NextResponse.json({ 
        error: 'Failed to delete event', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
