import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Get the current user ID
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, role, monthly_targets, personal_targets')
      .in('role', ['advisor', 'trainee'])
      .limit(1);

    if (usersError || !users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    const user = users[0];
    const userId = user.id;
    
    // Create test data for the last 7 days
    const testData = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate realistic test data
      const faCompleted = Math.floor(Math.random() * 3) + 1; // 1-3
      const ehCompleted = Math.floor(Math.random() * 2) + 1; // 1-2
      const newAppointments = Math.floor(Math.random() * 3) + 1; // 1-3
      const recommendations = Math.floor(Math.random() * 2) + 1; // 1-2
      const tivInvitations = Math.floor(Math.random() * 2); // 0-1
      const taaInvitations = Math.floor(Math.random() * 2); // 0-1
      const tgsRegistrations = Math.floor(Math.random() * 2); // 0-1
      const bavChecks = Math.floor(Math.random() * 2) + 1; // 1-2
      
      const personalTargets = user.personal_targets || {};
      const monthlyTargets = user.monthly_targets || {};
      
      const testEntry = {
        user_id: userId,
        entry_date: dateStr,
        date: dateStr,
        
        // Yesterday's completed tasks
        fa_completed: faCompleted,
        eh_completed: ehCompleted,
        new_appointments: newAppointments,
        recommendations: recommendations,
        tiv_invitations: tivInvitations,
        taa_invitations: taaInvitations,
        tgs_registrations: tgsRegistrations,
        bav_checks: bavChecks,
        
        // Today's goals (from personal targets)
        today_goals: {
          fa_target: personalTargets.fa_daily || 1,
          eh_target: personalTargets.eh_daily || 1,
          new_appointments_target: personalTargets.new_appointments_daily || 2,
          recommendations_target: personalTargets.recommendations_daily || 1,
          tiv_invitations_target: personalTargets.tiv_invitations_daily || 0,
          taa_invitations_target: personalTargets.taa_invitations_daily || 0,
          tgs_registrations_target: personalTargets.tgs_registrations_daily || 0,
          bav_checks_target: personalTargets.bav_checks_daily || 1
        },
        
        // Today's todos
        today_todos: [
          "Kundenanruf vorbereiten",
          "Präsentation aktualisieren",
          "Termine koordinieren",
          "Follow-up E-Mails schreiben",
          "Beratungsunterlagen sortieren"
        ],
        
        // Questions and answers
        help_needed: i === 0 ? "Unterstützung bei der Präsentation" : "Alles klar",
        training_focus: i === 0 ? "Kommunikationstechniken" : "Grundlagen der Beratung",
        improvement_today: i === 0 ? "Bessere Strukturierung" : "Mehr Selbstvertrauen",
        highlight_yesterday: i === 0 ? "Gutes Gespräch mit Herrn Müller" : "Erfolgreiche Beratung",
        appointments_next_week: Math.floor(Math.random() * 5) + 3, // 3-7
        weekly_improvement: i === 4 ? "Mehr strukturiert arbeiten" : "", // Only on Friday
        charisma_training: i === 0, // Only today
        
        // Additional fields
        todos_completed: [
          { text: "Kundenanruf vorbereiten", completed: true },
          { text: "Präsentation aktualisieren", completed: false },
          { text: "Termine koordinieren", completed: true }
        ],
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      testData.push(testEntry);
    }

    // Insert test data
    const { data: insertedData, error: insertError } = await supabase
      .from('daily_entries')
      .upsert(testData)
      .select();

    if (insertError) {
      console.error('Error inserting test data:', insertError);
      return NextResponse.json({ 
        error: 'Failed to insert test data', 
        details: insertError.message 
      }, { status: 500 });
    }

    // Also create a second user for team testing
    const { data: secondUser, error: secondUserError } = await supabase
      .from('users')
      .upsert({
        clerk_id: 'test_user_2',
        name: 'Sarah Weber',
        role: 'trainee',
        team_name: 'Test Team',
        personal_targets: {
          fa_daily: 3,
          eh_daily: 2,
          new_appointments_daily: 2,
          recommendations_daily: 1,
          tiv_invitations_daily: 1,
          taa_invitations_daily: 1,
          tgs_registrations_daily: 1,
          bav_checks_daily: 1
        },
        monthly_targets: {
          fa_target: 66,
          eh_target: 44,
          new_appointments_target: 44,
          recommendations_target: 22,
          tiv_invitations_target: 22,
          taa_invitations_target: 22,
          tgs_registrations_target: 22,
          bav_checks_target: 22
        },
        consent_given: true,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'clerk_id' })
      .select()
      .single();

    if (secondUser && !secondUserError) {
      // Create test data for second user
      const secondUserTestData = [];
      for (let i = 0; i < 3; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        secondUserTestData.push({
          user_id: secondUser.id,
          entry_date: dateStr,
          date: dateStr,
          fa_completed: Math.floor(Math.random() * 2) + 1,
          eh_completed: Math.floor(Math.random() * 2) + 1,
          new_appointments: Math.floor(Math.random() * 2) + 1,
          recommendations: Math.floor(Math.random() * 2),
          tiv_invitations: Math.floor(Math.random() * 2),
          taa_invitations: Math.floor(Math.random() * 2),
          tgs_registrations: Math.floor(Math.random() * 2),
          bav_checks: Math.floor(Math.random() * 2) + 1,
          help_needed: "Tipps für bessere Empfehlungsgespräche",
          training_focus: "Grundlagen der Beratung",
          improvement_today: "Mehr Selbstvertrauen in Gesprächen",
          highlight_yesterday: "Erfolgreiche erste Beratung alleine",
          appointments_next_week: Math.floor(Math.random() * 3) + 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      await supabase
        .from('daily_entries')
        .upsert(secondUserTestData);
    }

    return NextResponse.json({
      success: true,
      message: 'Kanzleiablauf test data created successfully',
      insertedEntries: insertedData?.length || 0,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      },
      testData: testData.slice(0, 2), // Show first 2 entries as sample
      secondUser: secondUser ? {
        id: secondUser.id,
        name: secondUser.name,
        role: secondUser.role
      } : null,
      status: "READY TO TEST KANZLEIABLAUF PAGE"
    });
  } catch (error) {
    console.error('Error in create-kanzleiablauf-test-data:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
