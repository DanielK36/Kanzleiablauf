import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    
    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get team data for the specified date
    const { data, error } = await supabase
      .from('team_data')
      .select('*')
      .eq('team_id', user.id)
      .eq('entry_date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching team data:', error);
      return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error('Error in GET /api/team-data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      entry_date,
      team_fa_total,
      team_eh_total,
      team_appointments_total,
      team_recommendations_total,
      advisor_comments,
      daily_focus,
      daily_summary,
      yesterday_goals,
      yesterday_results,
      today_goals,
      today_planning
    } = body;

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

    // Insert or update team data
    const { data, error } = await supabase
      .from('team_data')
      .upsert({
        team_id: user.id,
        entry_date,
        team_fa_total,
        team_eh_total,
        team_appointments_total,
        team_recommendations_total,
        advisor_comments,
        daily_focus,
        daily_summary,
        yesterday_goals,
        yesterday_results,
        today_goals,
        today_planning,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team data:', error);
      return NextResponse.json({ error: 'Failed to create team data' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/team-data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
