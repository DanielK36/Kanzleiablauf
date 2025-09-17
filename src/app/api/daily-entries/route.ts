import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/daily-entries called');
    
    const { userId } = await auth();
    if (!userId) {
      console.log('No userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('UserId:', userId);

    const body = await request.json();
    console.log('Received body:', body); // Debug log
    
    const {
      entry_date,
      fa_count,
      eh_count,
      new_appointments,
      tiv_count,
      taa_count,
      recommendations,
      todos,
      focus_area,
      help_request,
      weekend_positive,
      training_diamonds,
      saturday_appointments,
      tiv_invitations,
      taa_invitations,
      recommendation_effort,
      recommendation_expansion,
      week_positive,
      week_learnings,
      saturday_participation
    } = body;

    console.log('Creating Supabase client...');
    const supabase = createSupabaseServerClient();
    
    // Get user ID from users table
    console.log('Fetching user from database...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      console.error('User error:', userError);
      return NextResponse.json({ error: 'User not found', details: userError.message }, { status: 404 });
    }

    if (!user) {
      console.error('No user found for clerk_id:', userId);
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    console.log('User found:', user.id);

    // Prepare data with proper type conversion
    const entryData = {
      user_id: user.id,
      entry_date,
      fa_count: parseInt(fa_count) || 0,
      eh_count: parseInt(eh_count) || 0,
      new_appointments: parseInt(new_appointments) || 0,
      tiv_count: parseInt(tiv_count) || 0,
      taa_count: parseInt(taa_count) || 0,
      recommendations: parseInt(recommendations) || 0,
      todos: Array.isArray(todos) ? todos : [],
      focus_area: focus_area || '',
      help_request: help_request || '',
      weekend_positive: weekend_positive || '',
      training_diamonds: parseInt(training_diamonds) || 0,
      saturday_appointments: Array.isArray(saturday_appointments) ? saturday_appointments : [],
      tiv_invitations: parseInt(tiv_invitations) || 0,
      taa_invitations: parseInt(taa_invitations) || 0,
      recommendation_effort: recommendation_effort || '',
      recommendation_expansion: recommendation_expansion || '',
      week_positive: week_positive || '',
      week_learnings: week_learnings || '',
      saturday_participation: saturday_participation || false,
      updated_at: new Date().toISOString(),
    };

    console.log('Inserting data:', entryData); // Debug log

    // Insert or update daily entry
    console.log('Attempting upsert with data:', entryData);
    
    const { data, error } = await supabase
      .from('daily_entries')
      .upsert(entryData, {
        onConflict: 'user_id,entry_date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create daily entry', details: error.message }, { status: 500 });
    }

    console.log('Successfully created entry:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/daily-entries:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const supabase = createSupabaseServerClient();
    
    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let query = supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id);

    if (date) {
      query = query.eq('entry_date', date);
    } else {
      // Get last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      query = query.gte('entry_date', sevenDaysAgo.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('entry_date', { ascending: false });

    if (error) {
      console.error('Error fetching daily entries:', error);
      return NextResponse.json({ error: 'Failed to fetch daily entries' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/daily-entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
