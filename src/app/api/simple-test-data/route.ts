import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Get the current user
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, role')
      .in('role', ['advisor', 'trainee'])
      .limit(1);

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    const user = users[0];
    
    // Create simple test data for today and yesterday
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Today's entry
    const todayEntry = {
      user_id: user.id,
      entry_date: today,
      date: today,
      fa_completed: 2,
      eh_completed: 1,
      new_appointments: 3,
      recommendations: 2,
      tiv_invitations: 1,
      taa_invitations: 0,
      tgs_registrations: 1,
      bav_checks: 2,
      help_needed: "Unterstützung bei der Präsentation",
      training_focus: "Kommunikationstechniken für schwierige Gespräche",
      improvement_today: "Bessere Strukturierung der Beratungsgespräche",
      highlight_yesterday: "Gutes Gespräch mit Herrn Müller über bAV",
      appointments_next_week: 8,
      charisma_training: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Yesterday's entry
    const yesterdayEntry = {
      user_id: user.id,
      entry_date: yesterdayStr,
      date: yesterdayStr,
      fa_completed: 1,
      eh_completed: 2,
      new_appointments: 2,
      recommendations: 1,
      tiv_invitations: 0,
      taa_invitations: 1,
      tgs_registrations: 0,
      bav_checks: 1,
      highlight_yesterday: "Erfolgreiche Beratung mit Frau Schmidt",
      appointments_next_week: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert today's entry
    const { data: todayResult, error: todayError } = await supabase
      .from('daily_entries')
      .upsert(todayEntry)
      .select();

    if (todayError) {
      console.error('Error inserting today entry:', todayError);
      return NextResponse.json({ 
        error: 'Failed to insert today entry', 
        details: todayError.message 
      }, { status: 500 });
    }

    // Insert yesterday's entry
    const { data: yesterdayResult, error: yesterdayError } = await supabase
      .from('daily_entries')
      .upsert(yesterdayEntry)
      .select();

    if (yesterdayError) {
      console.error('Error inserting yesterday entry:', yesterdayError);
    }

    return NextResponse.json({
      success: true,
      message: 'Simple test data created successfully',
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      entries: {
        today: todayResult?.length || 0,
        yesterday: yesterdayResult?.length || 0
      },
      testData: {
        today: todayEntry,
        yesterday: yesterdayEntry
      },
      status: "READY TO TEST KANZLEIABLAUF PAGE"
    });
  } catch (error) {
    console.error('Error in simple-test-data:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
