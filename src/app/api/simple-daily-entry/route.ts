import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// EINFACHE API für Tageseintrag - ALLE Daten auf einmal
export async function GET() {
  try {
    console.log('🚀 EINFACHE API - GET Daily Entry Data');
    
    // Aktuelle User ID aus Clerk Auth holen
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const supabase = createSupabaseServerClient();
    
    // 1. User Data laden
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return NextResponse.json({ 
        success: false, 
        error: userError.message 
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // 2. Heutige Ziele aus personal_targets laden
    const { data: userWithTargets, error: targetsError } = await supabase
      .from('users')
      .select('personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (targetsError) {
      console.error('❌ Error fetching targets:', targetsError);
      return NextResponse.json({ 
        success: false, 
        error: targetsError.message 
      }, { status: 500 });
    }

    const targets = userWithTargets?.personal_targets || {};

    // 3. Gestern erreicht aus daily_entries laden
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: yesterdayEntry, error: yesterdayError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', yesterdayStr)
      .maybeSingle();

    if (yesterdayError) {
      console.error('❌ Error fetching yesterday entry:', yesterdayError);
      // Continue with empty data if there's an error
    }

    // 4. Heute Eintrag laden (falls vorhanden)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const { data: todayEntry, error: todayError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', todayStr)
      .maybeSingle();

    if (todayError) {
      console.error('❌ Error fetching today entry:', todayError);
      // Continue with empty data if there's an error
    }

    console.log('✅ Daily entry data loaded successfully');

    return NextResponse.json({
      success: true,
      data: {
        // Heutige Ziele (leer für neuen Tag - werden heute eingegeben)
        // Heute Ziele (was heute geplant wird - aus todayEntry.*_daily_target oder 0 wenn kein Eintrag)
        todayGoals: {
          fa: todayEntry?.fa_daily_target || 0,
          eh: todayEntry?.eh_daily_target || 0,
          newAppointments: todayEntry?.new_appointments_daily_target || 0,
          recommendations: todayEntry?.recommendations_daily_target || 0,
          tivInvitations: todayEntry?.tiv_invitations_daily_target || 0,
          bavChecks: todayEntry?.bav_checks_daily_target || 0,
          taaInvitations: todayEntry?.taa_invitations_daily_target || 0,
          tgsRegistrations: todayEntry?.tgs_registrations_daily_target || 0,
        },
        
        // Gestern erreicht (was heute für gestern eingegeben wurde - aus todayEntry)
        yesterdayResults: {
          fa: todayEntry?.fa_count || 0,
          eh: todayEntry?.eh_count || 0,
          newAppointments: todayEntry?.new_appointments || 0,
          recommendations: todayEntry?.recommendations || 0,
          tivInvitations: todayEntry?.tiv_invitations || 0,
          bavChecks: todayEntry?.bav_checks || 0,
          taaInvitations: todayEntry?.taa_invitations || 0,
          tgsRegistrations: todayEntry?.tgs_registrations || 0,
          todos_completed: todayEntry?.todos_completed || [false, false, false, false, false],
        },
        
        // Gestern Ziele (was war gestern als "heute" geplant - aus yesterdayEntry.*_daily_target)
        yesterdayGoals: {
          fa_daily_target: yesterdayEntry?.fa_daily_target || 0,
          eh_daily_target: yesterdayEntry?.eh_daily_target || 0,
          new_appointments_daily_target: yesterdayEntry?.new_appointments_daily_target || 0,
          recommendations_daily_target: yesterdayEntry?.recommendations_daily_target || 0,
          tiv_invitations_daily_target: yesterdayEntry?.tiv_invitations_daily_target || 0,
          bav_checks_daily_target: yesterdayEntry?.bav_checks_daily_target || 0,
          taa_invitations_daily_target: yesterdayEntry?.taa_invitations_daily_target || 0,
          tgs_registrations_daily_target: yesterdayEntry?.tgs_registrations_daily_target || 0,
        },
        
        // Debug: Log yesterday goals
        debug_yesterday_goals: {
          fa_daily_target: yesterdayEntry?.fa_daily_target,
          eh_daily_target: yesterdayEntry?.eh_daily_target,
          new_appointments_daily_target: yesterdayEntry?.new_appointments_daily_target,
          recommendations_daily_target: yesterdayEntry?.recommendations_daily_target,
          tiv_invitations_daily_target: yesterdayEntry?.tiv_invitations_daily_target,
          bav_checks_daily_target: yesterdayEntry?.bav_checks_daily_target,
          taa_invitations_daily_target: yesterdayEntry?.taa_invitations_daily_target,
          tgs_registrations_daily_target: yesterdayEntry?.tgs_registrations_daily_target,
        },
        
        // Todos von gestern (zum Abhaken)
        todos: yesterdayEntry?.today_todos || ['', '', '', '', ''],
        todosCompleted: todayEntry?.todos_completed || [false, false, false, false, false],
        
        // Debug: Log yesterday entry
        debug_yesterday_entry: yesterdayEntry,
        
        // Todos für heute (was heute geplant wird - aus daily_entries)
        todayTodos: todayEntry?.today_todos || ['', '', '', '', ''],
        charismaTraining: todayEntry?.charisma_training || false,
        highlightYesterday: todayEntry?.highlight_yesterday || '',
        appointmentsNextWeek: todayEntry?.appointments_next_week || 0,
        improvementToday: todayEntry?.improvement_today || '',
        help_needed: todayEntry?.help_needed || '',
        training_focus: todayEntry?.training_focus || '',
        improvement_focus: todayEntry?.improvement_focus || '',
        weekdayAnswers: todayEntry?.weekday_answers || {},
        weeklyImprovement: todayEntry?.weekly_improvement || '',
      }
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 EINFACHE API - POST Daily Entry Data');
    
    // Aktuelle User ID aus Clerk Auth holen
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const supabase = createSupabaseServerClient();
    const body = await request.json();
    
    // 1. User Data laden
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return NextResponse.json({ 
        success: false, 
        error: userError.message 
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // 2. Heutige Ziele in personal_targets speichern
    const existingTargets = user.personal_targets || {};
    const updatedTargets = {
      ...existingTargets,
      fa_daily: body.todayGoals.fa || 0,
      eh_daily: body.todayGoals.eh || 0,
      new_appointments_daily: body.todayGoals.newAppointments || 0,
      recommendations_daily: body.todayGoals.recommendations || 0,
      tiv_invitations_daily: body.todayGoals.tivInvitations || 0,
      bav_checks_daily: body.todayGoals.bavChecks || 0,
      taa_invitations_daily: body.todayGoals.taaInvitations || 0,
      tgs_registrations_daily: body.todayGoals.tgsRegistrations || 0,
    };

    const { error: targetsUpdateError } = await supabase
      .from('users')
      .update({ personal_targets: updatedTargets })
      .eq('clerk_id', userId);

    if (targetsUpdateError) {
      console.error('❌ Error updating targets:', targetsUpdateError);
      return NextResponse.json({ 
        success: false, 
        error: targetsUpdateError.message 
      }, { status: 500 });
    }

    // 3. Heute Eintrag in daily_entries speichern/aktualisieren
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const dailyEntryData = {
      user_id: user.id,
      entry_date: todayStr,
      fa_count: body.yesterdayResults.fa || 0,
      eh_count: body.yesterdayResults.eh || 0,
      new_appointments: body.yesterdayResults.newAppointments || 0,
      recommendations: body.yesterdayResults.recommendations || 0,
      tiv_invitations: body.yesterdayResults.tivInvitations || 0,
      bav_checks: body.yesterdayResults.bavChecks || 0,
      taa_invitations: body.yesterdayResults.taaInvitations || 0,
      tgs_registrations: body.yesterdayResults.tgsRegistrations || 0,
      // Heute's Ziele (werden morgen zu yesterdayGoals)
      fa_daily_target: body.todayGoals.fa || 0,
      eh_daily_target: body.todayGoals.eh || 0,
      new_appointments_daily_target: body.todayGoals.newAppointments || 0,
      recommendations_daily_target: body.todayGoals.recommendations || 0,
      tiv_invitations_daily_target: body.todayGoals.tivInvitations || 0,
      bav_checks_daily_target: body.todayGoals.bavChecks || 0,
      taa_invitations_daily_target: body.todayGoals.taaInvitations || 0,
      tgs_registrations_daily_target: body.todayGoals.tgsRegistrations || 0,
      today_todos: body.todayTodos || ['', '', '', '', ''], // Todos für heute
      todos_completed: body.todosCompleted || [false, false, false, false, false],
      charisma_training: body.charismaTraining || false,
      highlight_yesterday: body.highlightYesterday || '',
      appointments_next_week: body.appointmentsNextWeek || 0,
      improvement_today: body.improvementToday || '',
      help_needed: body.help_needed || '',
      training_focus: body.training_focus || '',
      improvement_focus: body.improvement_focus || '',
      weekday_answers: body.weekdayAnswers || {},
      weekly_improvement: body.weeklyImprovement || '',
    };

    // Prüfen ob heute bereits ein Eintrag existiert
    const { data: existingEntry } = await supabase
      .from('daily_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('entry_date', todayStr)
      .maybeSingle();

    let result;
    if (existingEntry) {
      // Update existing entry
      result = await supabase
        .from('daily_entries')
        .update(dailyEntryData)
        .eq('id', existingEntry.id)
        .select()
        .single();
    } else {
      // Insert new entry
      result = await supabase
        .from('daily_entries')
        .insert(dailyEntryData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('❌ Error saving daily entry:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error.message 
      }, { status: 500 });
    }

    console.log('✅ Daily entry data saved successfully');

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
