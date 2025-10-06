import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user using Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, team_name')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Get today's team focus
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: teamFocus, error } = await supabase
      .from('team_focus')
      .select('*')
      .eq('team_name', user.team_name)
      .eq('focus_date', today)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid 500 error

    if (error) {
      console.error('Error loading team focus:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to load team focus' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: teamFocus || null
    });

  } catch (error) {
    console.error('Error loading team focus:', error);
    return NextResponse.json({ error: 'Failed to load team focus' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user using Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, team_name')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { todayFocus } = body;

    // Validate required fields
    if (!todayFocus) {
      return NextResponse.json({ error: 'Missing todayFocus data' }, { status: 400 });
    }

    // Save to database
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: savedFocus, error } = await supabase
      .from('team_focus')
      .upsert({
        team_name: user.team_name,
        focus_date: today,
        training: todayFocus.training || '',
        phone_party: todayFocus.phoneParty || '',
        training_responsible: todayFocus.trainingResponsible || '',
        phone_party_responsible: todayFocus.phonePartyResponsible || '',
        created_by: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'team_name,focus_date'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving team focus:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save team focus' 
      }, { status: 500 });
    }

    console.log('🚀 Team Focus saved:', savedFocus);

    return NextResponse.json({
      success: true,
      message: 'Team focus saved successfully',
      data: savedFocus
    });

  } catch (error) {
    console.error('Error saving team focus:', error);
    return NextResponse.json({ error: 'Failed to save team focus' }, { status: 500 });
  }
}
