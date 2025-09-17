import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Test the team API structure
    const today = new Date().toISOString().split('T')[0];
    
    // Get all users with advisor role
    const { data: advisors, error: advisorsError } = await supabase
      .from('users')
      .select('id, name, role, monthly_targets, personal_targets')
      .in('role', ['advisor', 'trainee'])
      .limit(2);

    if (advisorsError) {
      return NextResponse.json({ error: 'Failed to fetch advisors', details: advisorsError.message }, { status: 500 });
    }

    // Get some sample daily entries
    const advisorIds = advisors?.map(advisor => advisor.id) || [];
    let sampleEntries = [];
    
    if (advisorIds.length > 0) {
      const { data: entries, error: entriesError } = await supabase
        .from('daily_entries')
        .select(`
          user_id,
          entry_date,
          fa_completed,
          eh_completed,
          new_appointments,
          recommendations,
          tiv_invitations,
          taa_invitations,
          tgs_registrations,
          bav_checks,
          help_needed,
          training_focus,
          improvement_today,
          highlight_yesterday,
          appointments_next_week,
          weekly_improvement
        `)
        .in('user_id', advisorIds)
        .gte('entry_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('entry_date', { ascending: false })
        .limit(10);

      if (entriesError) {
        console.error('Error fetching entries:', entriesError);
      } else {
        sampleEntries = entries || [];
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Team API structure test',
      today: today,
      advisors: advisors || [],
      sampleEntries: sampleEntries,
      testResult: {
        hasAdvisors: advisors && advisors.length > 0,
        hasEntries: sampleEntries.length > 0,
        structure: {
          advisorFields: ['id', 'name', 'role', 'monthly_targets', 'personal_targets'],
          entryFields: ['user_id', 'entry_date', 'fa_completed', 'eh_completed', 'help_needed', 'training_focus', 'improvement_today']
        },
        status: "READY FOR TEAM API TEST"
      }
    });
  } catch (error) {
    console.error('Error in test-team-api:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
