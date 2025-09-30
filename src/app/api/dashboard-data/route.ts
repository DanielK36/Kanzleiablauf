import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// EINFACHE API für Dashboard - ALLE Daten auf einmal
export async function GET(request: NextRequest) {
  try {
    
    // Aktuelle User ID aus Clerk Auth holen
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Check for view_user_id parameter
    const { searchParams } = new URL(request.url);
    const viewUserId = searchParams.get('view_user_id');
    const viewTeamName = searchParams.get('view_team_name');
    
    
    const supabase = createSupabaseServerClient();
    
    // 1. User Data laden (current user oder view user)
    let targetUserId = userId;
    if (viewUserId && viewUserId !== 'current-user') {
      // Load the target user by ID instead of clerk_id
      const { data: targetUser, error: targetUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', viewUserId)
        .single();
      
      if (targetUserError || !targetUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Target user not found' 
        }, { status: 404 });
      }
      
      // Use target user's clerk_id for authentication context
      targetUserId = targetUser.clerk_id;
    } else if (viewTeamName && viewTeamName !== 'current-user') {
      // Load the team leader for the specified team
      const { data: teamLeader, error: teamLeaderError } = await supabase
        .from('users')
        .select('*')
        .eq('team_name', viewTeamName)
        .eq('is_team_leader', true)
        .limit(1)
        .single();
      
      
      if (teamLeaderError || !teamLeader) {
        // Fallback: use current user
        targetUserId = userId;
      } else {
        // Use team leader's clerk_id for authentication context
        targetUserId = teamLeader.clerk_id;
      }
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*, personal_targets')
      .eq('clerk_id', targetUserId)
      .single();

    if (userError) {
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

    // Store current user for later use
    const currentUser = user;
    
    // Debug: Log user data to see what's being loaded


    // 2. Team Data laden (nur wenn team_id vorhanden ist)
    let userTeam = null;
    if (user.team_id) {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', user.team_id)
        .single();

      if (teamError) {
        // Nicht abbrechen, sondern mit null weiter machen
      } else {
        userTeam = teamData;
      }
    }

    // 3. Personal Targets laden (aus users Tabelle)
    const targets = user.personal_targets || {};

    // 4. Datums-Berechnungen
    const monthlyNow = new Date();
    const startOfMonth = new Date(monthlyNow.getFullYear(), monthlyNow.getMonth(), 1).toISOString();
    const endOfMonth = new Date(monthlyNow.getFullYear(), monthlyNow.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // 5. Daily Entries laden (eigene)
    const { data: ownDailyEntries, error: ownDailyEntriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', startOfMonth)
      .lte('entry_date', endOfMonth);

    if (ownDailyEntriesError) {
      return NextResponse.json({ 
        success: false, 
        error: ownDailyEntriesError.message 
      }, { status: 500 });
    }


    // 6. Eigene Monats-Ist-Zahlen berechnen
    const ownMonthlyProgress = {
      fa: 0,
      eh: 0,
      newAppointments: 0,
      recommendations: 0,
      tivInvitations: 0,
      bavChecks: 0,
      taaInvitations: 0,
      tgsRegistrations: 0
    };

    ownDailyEntries?.forEach(entry => {
      ownMonthlyProgress.fa += entry.fa_count || 0;
      ownMonthlyProgress.eh += entry.eh_count || 0;
      ownMonthlyProgress.newAppointments += entry.new_appointments || 0;
      ownMonthlyProgress.recommendations += entry.recommendations || 0;
      ownMonthlyProgress.tivInvitations += entry.tiv_invitations || 0;
      ownMonthlyProgress.bavChecks += entry.bav_checks || 0;
      ownMonthlyProgress.taaInvitations += entry.taa_invitations || 0;
      ownMonthlyProgress.tgsRegistrations += entry.tgs_registrations || 0;
    });

    // 7. Weekly Progress berechnen (Dienstag bis Sonntag - Montag immer 0)
    const weeklyNow = new Date();
    const weeklyCurrentDay = weeklyNow.getDay(); // 0 = Sonntag, 1 = Montag, etc.
    
    // Wenn Montag, zeige 0. Sonst berechne von Dienstag bis heute
    let weeklyStartStr, weeklyEndStr;
    if (weeklyCurrentDay === 1) { // Montag
      weeklyStartStr = weeklyNow.toISOString().split('T')[0]; // Heute (Montag)
      weeklyEndStr = weeklyNow.toISOString().split('T')[0]; // Heute (Montag)
    } else {
      // Dienstag bis Sonntag: Von Dienstag bis heute
      const weeklyDaysFromTuesday = weeklyCurrentDay === 0 ? 5 : weeklyCurrentDay - 2; // Dienstag = 2
      const weeklyStartOfWeek = new Date(weeklyNow);
      weeklyStartOfWeek.setDate(weeklyNow.getDate() - weeklyDaysFromTuesday);
      
      weeklyStartStr = weeklyStartOfWeek.toISOString().split('T')[0];
      weeklyEndStr = weeklyNow.toISOString().split('T')[0];
    }
    
    let weeklyProgress: {
      fa_current: number;
      eh_current: number;
      new_appointments_current: number;
      recommendations_current: number;
      tiv_invitations_current: number;
      bav_checks_current: number;
      taa_invitations_current: number;
      tgs_registrations_current: number;
    };
    
    if (weeklyCurrentDay === 1) { // Montag
      weeklyProgress = {
        fa_current: 0,
        eh_current: 0,
        new_appointments_current: 0,
        recommendations_current: 0,
        tiv_invitations_current: 0,
        bav_checks_current: 0,
        taa_invitations_current: 0,
        tgs_registrations_current: 0,
      };
    } else {
      // Verwende bereits berechnete weeklyStartStr und weeklyEndStr (Dienstag bis Sonntag)
      // Lade Einträge für diese Woche
      const { data: weeklyEntries, error: weeklyEntriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', weeklyStartStr)
        .lte('entry_date', weeklyEndStr);

      if (weeklyEntriesError) {
        return NextResponse.json({ 
          success: false, 
          error: weeklyEntriesError.message 
        }, { status: 500 });
      }

      // Summiere die Woche
      weeklyProgress = {
        fa_current: 0,
        eh_current: 0,
        new_appointments_current: 0,
        recommendations_current: 0,
        tiv_invitations_current: 0,
        bav_checks_current: 0,
        taa_invitations_current: 0,
        tgs_registrations_current: 0,
      };

      weeklyEntries?.forEach(entry => {
        weeklyProgress.fa_current += entry.fa_count || 0;
        weeklyProgress.eh_current += entry.eh_count || 0;
        weeklyProgress.new_appointments_current += entry.new_appointments || 0;
        weeklyProgress.recommendations_current += entry.recommendations || 0;
        weeklyProgress.tiv_invitations_current += entry.tiv_invitations || 0;
        weeklyProgress.bav_checks_current += entry.bav_checks || 0;
        weeklyProgress.taa_invitations_current += entry.taa_invitations || 0;
        weeklyProgress.tgs_registrations_current += entry.tgs_registrations || 0;
      });
    }

    // 8. Hierarchie-basierte Team-Struktur aufbauen
    let directTeamUsers: any[] = [];
    let subteams: any[] = [];
    
    
    // Bestimme die richtige User-ID für die Hierarchie-Abfrage
    let hierarchyUserId = user.id;
    if (viewTeamName && viewTeamName !== 'current-user') {
      // Bei Team-View: Team-Leader für die Hierarchie verwenden
      const { data: teamLeader, error: teamLeaderError } = await supabase
        .from('users')
        .select('id')
        .eq('team_name', viewTeamName)
        .eq('is_team_leader', true)
        .limit(1)
        .single();
      
      if (!teamLeaderError && teamLeader) {
        hierarchyUserId = teamLeader.id;
      }
    }
    
    // Alle direkten Untergebenen laden (parent_leader_id = hierarchyUserId)
    const { data: directSubordinates, error: directSubordinatesError } = await supabase
      .from('users')
      .select('id, name, role, team_id, team_name, personal_targets, parent_leader_id, is_team_leader')
      .eq('parent_leader_id', hierarchyUserId);
    
    
    if (directSubordinatesError) {
    } else if (directSubordinates && directSubordinates.length > 0) {
      
      // Direkte Untergebene in direkte Mitarbeiter und Team-Leader aufteilen
      const directEmployees = directSubordinates.filter(u => !u.is_team_leader);
      const teamLeaders = directSubordinates.filter(u => u.is_team_leader);
      
      
      // Direkte Mitarbeiter zu directTeamUsers hinzufügen (nur direkte Untergebene, keine Team-Leader)
      directTeamUsers = directSubordinates.filter(u => !u.is_team_leader);
      
      // Für jeden Team-Leader: Subteam-Mitglieder laden
      for (const teamLeader of teamLeaders) {
        const { data: subteamMembers, error: subteamMembersError } = await supabase
          .from('users')
          .select('id, name, role, team_id, team_name, personal_targets, parent_leader_id')
          .eq('parent_leader_id', teamLeader.id);
        
        
        if (!subteamMembersError && subteamMembers) {
          subteams.push({
            teamLeader: teamLeader,
            members: subteamMembers,
            isSubteam: true
          });
        }
      }
    } else {
      
      // Check if hierarchy fields exist and are populated
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, name, role, team_id, team_name, personal_targets, parent_leader_id, is_team_leader')
        .neq('id', user.id); // Exclude current user
      
      if (!allUsersError && allUsers) {
        
        // For development: show all users as direct team members if no hierarchy is set
        if (allUsers.filter(u => u.parent_leader_id).length === 0) {
          directTeamUsers = allUsers.filter(u => !u.is_team_leader);
          const teamLeaders = allUsers.filter(u => u.is_team_leader);
          
          for (const teamLeader of teamLeaders) {
            subteams.push({
              teamLeader: teamLeader,
              members: [], // No sub-members for now
              isSubteam: true
            });
          }
        } else {
          // Hierarchy is set up, but current user has no direct subordinates
          // Marcel hat keine direkten Untergebenen -> nur eigenes Team anzeigen
          directTeamUsers = [];
          subteams = [];
          
          // Eigenes Team als "Subteam" hinzufügen (ohne Team-Leader)
          if (user.team_name) {
            subteams.push({
              teamLeader: {
                id: user.id,
                name: user.name,
                team_name: user.team_name,
                is_team_leader: true, // Marcel ist der Team-Leader für sein eigenes Team
                personal_targets: user.personal_targets // WICHTIG: personal_targets hinzufügen
              },
              members: [], // Keine zusätzlichen Mitglieder
              isSubteam: true
            });
          }
        }
      }
    }
    

    // 8.1. Team Goals aus aktueller User's personal_targets laden (nicht mehr Admin)

    // directTeamUsersError wird jetzt oben behandelt

    // 9. Team Monats-Ist-Zahlen berechnen (für "Orga Monatsziele")
    const teamUserIds = directTeamUsers?.map(u => u.id) || [];
    
    const { data: teamDailyEntries, error: teamDailyEntriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .in('user_id', teamUserIds)
      .gte('entry_date', startOfMonth)
      .lte('entry_date', endOfMonth);


    if (teamDailyEntriesError) {
      return NextResponse.json({ 
        success: false, 
        error: teamDailyEntriesError.message 
      }, { status: 500 });
    }

    const teamMonthlyProgress = {
      fa: 0,
      eh: 0,
      newAppointments: 0,
      recommendations: 0,
      tivInvitations: 0,
      bavChecks: 0,
      taaInvitations: 0,
      tgsRegistrations: 0
    };

    // Team Monthly Ist-Zahlen berechnen
    teamDailyEntries?.forEach(entry => {
      teamMonthlyProgress.fa += entry.fa_count || 0;
      teamMonthlyProgress.eh += entry.eh_count || 0;
      teamMonthlyProgress.newAppointments += entry.new_appointments || 0;
      teamMonthlyProgress.recommendations += entry.recommendations || 0;
      teamMonthlyProgress.tivInvitations += entry.tiv_invitations || 0;
      teamMonthlyProgress.bavChecks += entry.bav_checks || 0;
      teamMonthlyProgress.taaInvitations += entry.taa_invitations || 0;
      teamMonthlyProgress.tgsRegistrations += entry.tgs_registrations || 0;
    });
    

    // 10. Team Members mit Daten aufbauen
    const teamMembers = [];
    
    // Alle Team-Mitglieder sammeln: directTeamUsers + currentUser + subteams
    const allTeamUsers = [];
    const processedUserIds = new Set(); // Duplikate vermeiden
    
    // 1. Direct Team Users hinzufügen (aber nicht Team-Leader, die werden später als Subteams hinzugefügt)
    if (directTeamUsers) {
      for (const user of directTeamUsers) {
        if (!processedUserIds.has(user.id) && !user.is_team_leader) {
          allTeamUsers.push(user);
          processedUserIds.add(user.id);
        }
      }
    }
    
    // 1.5. Current User hinzufügen (falls noch nicht hinzugefügt)
    // ABER: Wenn currentUser als team_leader in subteams ist, nicht doppelt hinzufügen
    if (currentUser && !processedUserIds.has(currentUser.id)) {
      // Prüfe ob currentUser bereits als team_leader in subteams ist
      const isAlreadyTeamLeader = subteams.some(subteam => subteam.teamLeader.id === currentUser.id);
      
      if (!isAlreadyTeamLeader) {
        allTeamUsers.push(currentUser);
        processedUserIds.add(currentUser.id);
      } else {
      }
    }
    
    // 3. Subteam-Mitglieder hinzufügen
    if (subteams) {
      for (const subteam of subteams) {
        // Team-Leader hinzufügen (falls noch nicht hinzugefügt)
        if (!processedUserIds.has(subteam.teamLeader.id)) {
          allTeamUsers.push(subteam.teamLeader);
          processedUserIds.add(subteam.teamLeader.id);
        }
        // Subteam-Mitglieder hinzufügen
        if (subteam.members) {
          for (const member of subteam.members) {
            if (!processedUserIds.has(member.id)) {
              allTeamUsers.push(member);
              processedUserIds.add(member.id);
            }
          }
        }
      }
    }
    
    
    
    // Debug: Check if Robin is in allTeamUsers
    const robinInAllTeamUsers = allTeamUsers.find(u => u.name?.includes('Robin'));
    
    for (const teamUser of allTeamUsers) {
      
      // Daily Entries für diesen User laden (letzten 30 Tage für bessere Abdeckung)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      const { data: userDailyEntries, error: userDailyEntriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .eq('user_id', teamUser.id)
        .gte('entry_date', thirtyDaysAgoStr)
        .order('entry_date', { ascending: false });

      if (userDailyEntriesError) {
        continue;
      }
      

      // Heute und Gestern Einträge finden
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Finde den gestrigen Eintrag für yesterdayGoals
      // yesterdayStr ist bereits oben definiert
      
      const yesterdayEntry = userDailyEntries?.find(entry => entry.entry_date === yesterdayStr);
      const latestEntry = userDailyEntries?.[0]; // Neuester Eintrag für todayGoals und todayAnswers

      // Debug-Logs für alle User
      if (teamUser.name === 'Daniel Kuhlen' || teamUser.name === 'Marcel Jansen') {
      }

      // WICHTIG: Nur wenn latestEntry von heute oder gestern ist, sonst 0
      const isRecentEntry = latestEntry && (
        latestEntry.entry_date === todayStr || 
        latestEntry.entry_date === yesterdayStr
      );

      // Yesterday Results (Ist-Werte aus heutigem Eintrag, nur wenn aktuell)
      const yesterdayResults = {
        fa_actual: isRecentEntry ? (latestEntry?.fa_count || 0) : 0,
        eh_actual: isRecentEntry ? (latestEntry?.eh_count || 0) : 0,
        new_appointments_actual: isRecentEntry ? (latestEntry?.new_appointments || 0) : 0,
        recommendations_actual: isRecentEntry ? (latestEntry?.recommendations || 0) : 0,
        tiv_invitations_actual: isRecentEntry ? (latestEntry?.tiv_invitations || 0) : 0,
        bav_checks_actual: isRecentEntry ? (latestEntry?.bav_checks || 0) : 0,
        taa_invitations_actual: isRecentEntry ? (latestEntry?.taa_invitations || 0) : 0,
        tgs_registrations_actual: isRecentEntry ? (latestEntry?.tgs_registrations || 0) : 0,
        todos_completed: isRecentEntry && Array.isArray(latestEntry?.todos_completed) 
          ? latestEntry.todos_completed
          : [],
        // Alle Todos anzeigen (nicht nur abgehakte) - aus today_todos JSONB
        todos: isRecentEntry && Array.isArray(latestEntry?.today_todos) 
          ? latestEntry.today_todos
          : [],
        mood_feedback: isRecentEntry ? (latestEntry?.mood_feedback || '') : '',
        // Fragen-Antworten von gestern
        highlight_yesterday: isRecentEntry ? (latestEntry?.highlight_yesterday || '') : '',
        appointments_next_week: isRecentEntry ? (latestEntry?.appointments_next_week || 0) : 0,
        improvement_today: isRecentEntry ? (latestEntry?.improvement_today || '') : '',
        weekly_improvement: isRecentEntry ? (latestEntry?.weekly_improvement || '') : '',
        charisma_training: isRecentEntry ? (latestEntry?.charisma_training || false) : false,
      };

      // Personal Targets für Weekly/Monthly Goals
      const personalTargets = teamUser.personal_targets || {};

      // Yesterday Goals (Ziele aus gestrigem Eintrag, nur wenn aktuell)
      const yesterdayGoals = {
        fa_daily_target: (yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr) ? (yesterdayEntry?.fa_daily_target || 0) : 0,
        eh_daily_target: (yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr) ? (yesterdayEntry?.eh_daily_target || 0) : 0,
        new_appointments_daily_target: (yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr) ? (yesterdayEntry?.new_appointments_daily_target || 0) : 0,
        recommendations_daily_target: (yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr) ? (yesterdayEntry?.recommendations_daily_target || 0) : 0,
        tiv_invitations_daily_target: (yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr) ? (yesterdayEntry?.tiv_invitations_daily_target || 0) : 0,
        bav_checks_daily_target: (yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr) ? (yesterdayEntry?.bav_checks_daily_target || 0) : 0,
        taa_invitations_daily_target: (yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr) ? (yesterdayEntry?.taa_invitations_daily_target || 0) : 0,
        tgs_registrations_daily_target: (yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr) ? (yesterdayEntry?.tgs_registrations_daily_target || 0) : 0,
      };

      // Today Goals (aus neuestem Eintrag, nur wenn aktuell)
      const todayGoals = {
        fa_daily_target: isRecentEntry ? (latestEntry?.fa_daily_target || 0) : 0,
        eh_daily_target: isRecentEntry ? (latestEntry?.eh_daily_target || 0) : 0,
        new_appointments_daily_target: isRecentEntry ? (latestEntry?.new_appointments_daily_target || 0) : 0,
        recommendations_daily_target: isRecentEntry ? (latestEntry?.recommendations_daily_target || 0) : 0,
        tiv_invitations_daily_target: isRecentEntry ? (latestEntry?.tiv_invitations_daily_target || 0) : 0,
        bav_checks_daily_target: isRecentEntry ? (latestEntry?.bav_checks_daily_target || 0) : 0,
        taa_invitations_daily_target: isRecentEntry ? (latestEntry?.taa_invitations_daily_target || 0) : 0,
        tgs_registrations_daily_target: isRecentEntry ? (latestEntry?.tgs_registrations_daily_target || 0) : 0,
      };

      // Today Answers (Antworten aus neuestem Eintag)
      const todayAnswers = {
        help_needed: latestEntry?.help_needed || '',
        training_focus: latestEntry?.training_focus || '',
        improvement_today: latestEntry?.improvement_today || '',
        weekday_answers: latestEntry?.weekday_answers || {},
        // Spezifische Antworten auf Fragen basierend auf Index
        question_0: latestEntry?.weekday_answers?.[0] || '',
        question_1: latestEntry?.weekday_answers?.[1] || '',
        question_2: latestEntry?.weekday_answers?.[2] || '',
        question_3: latestEntry?.weekday_answers?.[3] || '',
      };

      // Today Todos (heutige Todos)
      const todayTodos = Array.isArray(latestEntry?.today_todos) 
        ? latestEntry.today_todos.filter(Boolean)
        : [];

      // Debug: Log weekday_answers for troubleshooting

      // Weekly Ist-Zahlen berechnen (aktuelle Woche)

      // Weekly Progress für diesen User (aus weekly_goals Tabelle)
      const weeklyProgress = {
        fa_weekly_target: 0,
        fa_actual: 0,
        eh_weekly_target: 0,
        eh_actual: 0,
        new_appointments_weekly_target: 0,
        new_appointments_actual: 0,
        recommendations_weekly_target: 0,
        recommendations_actual: 0,
        tiv_invitations_weekly_target: 0,
        tiv_invitations_actual: 0,
        bav_checks_weekly_target: 0,
        bav_checks_actual: 0,
        taa_invitations_weekly_target: 0,
        taa_invitations_actual: 0,
        tgs_registrations_weekly_target: 0,
        tgs_registrations_actual: 0,
      };

      // Weekly Goals aus personal_targets laden (personalTargets bereits oben definiert)
      if (personalTargets) {
        weeklyProgress.fa_weekly_target = personalTargets.fa_weekly ?? 0;
        weeklyProgress.eh_weekly_target = personalTargets.eh_weekly ?? 0;
        weeklyProgress.new_appointments_weekly_target = personalTargets.new_appointments_weekly ?? 0;
        weeklyProgress.recommendations_weekly_target = personalTargets.recommendations_weekly ?? 0;
        weeklyProgress.tiv_invitations_weekly_target = personalTargets.tiv_invitations_weekly ?? 0;
        weeklyProgress.bav_checks_weekly_target = personalTargets.bav_checks_weekly ?? 0;
        weeklyProgress.taa_invitations_weekly_target = personalTargets.taa_invitations_weekly ?? 0;
        weeklyProgress.tgs_registrations_weekly_target = personalTargets.tgs_registrations_weekly ?? 0;
      }

      // Wenn Montag, zeige 0. Sonst filtere und addiere Einträge
      if (weeklyCurrentDay === 1) { // Montag
        // Alle Werte bleiben 0 (bereits initialisiert)
      } else {
        const weeklyEntries = userDailyEntries?.filter(entry => 
          entry.entry_date >= weeklyStartStr && entry.entry_date <= weeklyEndStr
        ) || [];


        // WICHTIG: weeklyProgress.actual soll die Wochensumme bleiben, nicht überschrieben werden
        weeklyEntries.forEach(entry => {
          weeklyProgress.fa_actual += entry.fa_count || 0;
          weeklyProgress.eh_actual += entry.eh_count || 0;
          weeklyProgress.new_appointments_actual += entry.new_appointments || 0;
          weeklyProgress.recommendations_actual += entry.recommendations || 0;
          weeklyProgress.tiv_invitations_actual += entry.tiv_invitations || 0;
          weeklyProgress.bav_checks_actual += entry.bav_checks || 0;
          weeklyProgress.taa_invitations_actual += entry.taa_invitations || 0;
          weeklyProgress.tgs_registrations_actual += entry.tgs_registrations || 0;
        });
      }

      // Monthly Progress für diesen User (aus monthly_goals Tabelle)
      const monthlyProgress = {
        fa_monthly_target: 0,
        fa_actual: 0,
        eh_monthly_target: 0,
        eh_actual: 0,
        new_appointments_monthly_target: 0,
        new_appointments_actual: 0,
        recommendations_monthly_target: 0,
        recommendations_actual: 0,
        tiv_invitations_monthly_target: 0,
        tiv_invitations_actual: 0,
        bav_checks_monthly_target: 0,
        bav_checks_actual: 0,
        taa_invitations_monthly_target: 0,
        taa_invitations_actual: 0,
        tgs_registrations_monthly_target: 0,
        tgs_registrations_actual: 0,
      };

      // Monthly Goals aus personal_targets laden
      if (personalTargets) {
        monthlyProgress.fa_monthly_target = personalTargets.fa_monthly_target ?? 0;
        monthlyProgress.eh_monthly_target = personalTargets.eh_monthly_target ?? 0;
        monthlyProgress.new_appointments_monthly_target = personalTargets.new_appointments_monthly_target ?? 0;
        monthlyProgress.recommendations_monthly_target = personalTargets.recommendations_monthly_target ?? 0;
        monthlyProgress.tiv_invitations_monthly_target = personalTargets.tiv_invitations_monthly_target ?? 0;
        monthlyProgress.bav_checks_monthly_target = personalTargets.bav_checks_monthly_target ?? 0;
        monthlyProgress.taa_invitations_monthly_target = personalTargets.taa_invitations_monthly_target ?? 0;
        monthlyProgress.tgs_registrations_monthly_target = personalTargets.tgs_registrations_monthly_target ?? 0;
      }

      // Monthly Ist-Zahlen berechnen (aktueller Monat)
      const monthlyEntries = userDailyEntries?.filter(entry => 
        entry.entry_date >= startOfMonth && entry.entry_date <= endOfMonth
      ) || [];

      monthlyEntries.forEach(entry => {
        monthlyProgress.fa_actual += entry.fa_count || 0;
        monthlyProgress.eh_actual += entry.eh_count || 0;
        monthlyProgress.new_appointments_actual += entry.new_appointments || 0;
        monthlyProgress.recommendations_actual += entry.recommendations || 0;
        monthlyProgress.tiv_invitations_actual += entry.tiv_invitations || 0;
        monthlyProgress.bav_checks_actual += entry.bav_checks || 0;
        monthlyProgress.taa_invitations_actual += entry.taa_invitations || 0;
        monthlyProgress.tgs_registrations_actual += entry.tgs_registrations || 0;
      });

      // Debug: Log final data before pushing
      if (teamUser.name === 'Daniel Kuhlen' || teamUser.name === 'Marcel Jansen') {
      }
      if (teamUser.name === 'Robin' || teamUser.name === 'Robin Ache' || teamUser.name?.includes('Robin')) {
      }

      teamMembers.push({
        id: teamUser.id,
        name: teamUser.name,
        firstName: teamUser.name?.split(' ')[0],
        role: teamUser.role,
        isTrainee: teamUser.role === 'trainee',
        team_name: teamUser.team_name, // WICHTIG: team_name hinzufügen
        personal_targets: teamUser.personal_targets, // WICHTIG: personal_targets hinzufügen
        yesterdayResults,
        yesterdayGoals,
        todayGoals,
        todayAnswers,
        weekdayAnswers: todayAnswers.weekday_answers, // Frontend erwartet weekdayAnswers
        todayTodos,
        weeklyProgress,
        monthlyProgress,
      });
    }

    // 10. Team Totals berechnen (nur direkte Team-Mitglieder)
    const teamTotals = {
      fa_daily_target: 0,
      fa_actual: 0,
      eh_daily_target: 0,
      eh_actual: 0,
      new_appointments_daily_target: 0,
      new_appointments_actual: 0,
      recommendations_daily_target: 0,
      recommendations_actual: 0,
      tiv_invitations_daily_target: 0,
      tiv_invitations_actual: 0,
      bav_checks_daily_target: 0,
      bav_checks_actual: 0,
      taa_invitations_daily_target: 0,
      taa_invitations_actual: 0,
      tgs_registrations_daily_target: 0,
      tgs_registrations_actual: 0,
    };

    teamMembers.forEach(member => {
      teamTotals.fa_daily_target += member.yesterdayGoals.fa_daily_target;
      teamTotals.fa_actual += member.yesterdayResults.fa_actual;
      teamTotals.eh_daily_target += member.yesterdayGoals.eh_daily_target;
      teamTotals.eh_actual += member.yesterdayResults.eh_actual;
      teamTotals.new_appointments_daily_target += member.yesterdayGoals.new_appointments_daily_target;
      teamTotals.new_appointments_actual += member.yesterdayResults.new_appointments_actual;
      teamTotals.recommendations_daily_target += member.yesterdayGoals.recommendations_daily_target;
      teamTotals.recommendations_actual += member.yesterdayResults.recommendations_actual;
      teamTotals.tiv_invitations_daily_target += member.yesterdayGoals.tiv_invitations_daily_target;
      teamTotals.tiv_invitations_actual += member.yesterdayResults.tiv_invitations_actual;
      teamTotals.bav_checks_daily_target += member.yesterdayGoals.bav_checks_daily_target;
      teamTotals.bav_checks_actual += member.yesterdayResults.bav_checks_actual;
      teamTotals.taa_invitations_daily_target += member.yesterdayGoals.taa_invitations_daily_target;
      teamTotals.taa_invitations_actual += member.yesterdayResults.taa_invitations_actual;
      teamTotals.tgs_registrations_daily_target += member.yesterdayGoals.tgs_registrations_daily_target;
      teamTotals.tgs_registrations_actual += member.yesterdayResults.tgs_registrations_actual;
    });

    // 11. Team Weekly & Monthly Progress berechnen
    const teamWeeklyProgress = {
      fa_weekly_target: 0,
      fa_actual: 0,
      eh_weekly_target: 0,
      eh_actual: 0,
      new_appointments_weekly_target: 0,
      new_appointments_actual: 0,
      recommendations_weekly_target: 0,
      recommendations_actual: 0,
      tiv_invitations_weekly_target: 0,
      tiv_invitations_actual: 0,
      bav_checks_weekly_target: 0,
      bav_checks_actual: 0,
      taa_invitations_weekly_target: 0,
      taa_invitations_actual: 0,
      tgs_registrations_weekly_target: 0,
      tgs_registrations_actual: 0,
    };

    // Team Weekly Progress berechnen
    teamMembers.forEach(member => {
      teamWeeklyProgress.fa_weekly_target += member.weeklyProgress.fa_weekly_target;
      teamWeeklyProgress.fa_actual += member.weeklyProgress.fa_actual;
      teamWeeklyProgress.eh_weekly_target += member.weeklyProgress.eh_weekly_target;
      teamWeeklyProgress.eh_actual += member.weeklyProgress.eh_actual;
      teamWeeklyProgress.new_appointments_weekly_target += member.weeklyProgress.new_appointments_weekly_target;
      teamWeeklyProgress.new_appointments_actual += member.weeklyProgress.new_appointments_actual;
      teamWeeklyProgress.recommendations_weekly_target += member.weeklyProgress.recommendations_weekly_target;
      teamWeeklyProgress.recommendations_actual += member.weeklyProgress.recommendations_actual;
      teamWeeklyProgress.tiv_invitations_weekly_target += member.weeklyProgress.tiv_invitations_weekly_target;
      teamWeeklyProgress.tiv_invitations_actual += member.weeklyProgress.tiv_invitations_actual;
      teamWeeklyProgress.bav_checks_weekly_target += member.weeklyProgress.bav_checks_weekly_target;
      teamWeeklyProgress.bav_checks_actual += member.weeklyProgress.bav_checks_actual;
      teamWeeklyProgress.taa_invitations_weekly_target += member.weeklyProgress.taa_invitations_weekly_target;
      teamWeeklyProgress.taa_invitations_actual += member.weeklyProgress.taa_invitations_actual;
      teamWeeklyProgress.tgs_registrations_weekly_target += member.weeklyProgress.tgs_registrations_weekly_target;
      teamWeeklyProgress.tgs_registrations_actual += member.weeklyProgress.tgs_registrations_actual;
    });

    // Team Totals für heute (heutige Ziele)
    const teamTodayGoals = {
      fa_daily_target: 0,
      eh_daily_target: 0,
      new_appointments_daily_target: 0,
      recommendations_daily_target: 0,
      tiv_invitations_daily_target: 0,
      bav_checks_daily_target: 0,
      taa_invitations_daily_target: 0,
      tgs_registrations_daily_target: 0,
    };

    teamMembers.forEach(member => {
      teamTodayGoals.fa_daily_target += member.todayGoals.fa_daily_target;
      teamTodayGoals.eh_daily_target += member.todayGoals.eh_daily_target;
      teamTodayGoals.new_appointments_daily_target += member.todayGoals.new_appointments_daily_target;
      teamTodayGoals.recommendations_daily_target += member.todayGoals.recommendations_daily_target;
      teamTodayGoals.tiv_invitations_daily_target += member.todayGoals.tiv_invitations_daily_target;
      teamTodayGoals.bav_checks_daily_target += member.todayGoals.bav_checks_daily_target;
      teamTodayGoals.taa_invitations_daily_target += member.todayGoals.taa_invitations_daily_target;
      teamTodayGoals.tgs_registrations_daily_target += member.todayGoals.tgs_registrations_daily_target;
    });

    return NextResponse.json({
      success: true,
      data: {
        // User Info
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          team_id: user.team_id,
          team_name: user.team_name || userTeam?.name || 'Kein Team',
        },
        
        // Weekly Goals (persönlich) - aus personal_targets
        weeklyGoals: {
          fa: targets?.fa_weekly ?? 0,
          eh: targets?.eh_weekly ?? 0,
          newAppointments: targets?.new_appointments_weekly ?? 0,
          recommendations: targets?.recommendations_weekly ?? 0,
          tivInvitations: targets?.tiv_invitations_weekly ?? 0,
          bavChecks: targets?.bav_checks_weekly ?? 0,
          taaInvitations: targets?.taa_invitations_weekly ?? 0,
          tgsRegistrations: targets?.tgs_registrations_weekly ?? 0,
          // Für simple-kanzleiablauf (lange Namen)
          fa_weekly_target: targets?.fa_weekly ?? 0,
          eh_weekly_target: targets?.eh_weekly ?? 0,
          new_appointments_weekly_target: targets?.new_appointments_weekly ?? 0,
          recommendations_weekly_target: targets?.recommendations_weekly ?? 0,
          tiv_invitations_weekly_target: targets?.tiv_invitations_weekly ?? 0,
          bav_checks_weekly_target: targets?.bav_checks_weekly ?? 0,
          taa_invitations_weekly_target: targets?.taa_invitations_weekly ?? 0,
          tgs_registrations_weekly_target: targets?.tgs_registrations_weekly ?? 0,
        },
        
        // Monthly Goals (persönlich) - aus personal_targets
        monthlyGoals: {
          fa: targets?.fa_monthly_target ?? 0,
          eh: targets?.eh_monthly_target ?? 0,
          newAppointments: targets?.new_appointments_monthly_target ?? 0,
          recommendations: targets?.recommendations_monthly_target ?? 0,
          tivInvitations: targets?.tiv_invitations_monthly_target ?? 0,
          bavChecks: targets?.bav_checks_monthly_target ?? 0,
          taaInvitations: targets?.taa_invitations_monthly_target ?? 0,
          tgsRegistrations: targets?.tgs_registrations_monthly_target ?? 0,
        },
        
        // Team Goals (für Organisation) - aus aktueller User's Team-Targets
        teamGoals: {
          fa: targets?.fa_team_target ?? 0,
          eh: targets?.eh_team_target ?? 0,
          newAppointments: targets?.new_appointments_team_target ?? 0,
          recommendations: targets?.recommendations_team_target ?? 0,
          tivInvitations: targets?.tiv_invitations_team_target ?? 0,
          bavChecks: targets?.bav_checks_team_target ?? 0,
          taaInvitations: targets?.taa_invitations_team_target ?? 0,
          tgsRegistrations: targets?.tgs_registrations_team_target ?? 0,
        },
        
        // Eigene Monats-Ist-Zahlen (für "Eigene Monatsziele")
        ownMonthlyProgress: {
          fa: ownMonthlyProgress.fa,
          eh: ownMonthlyProgress.eh,
          newAppointments: ownMonthlyProgress.newAppointments,
          recommendations: ownMonthlyProgress.recommendations,
          tivInvitations: ownMonthlyProgress.tivInvitations,
          bavChecks: ownMonthlyProgress.bavChecks,
          taaInvitations: ownMonthlyProgress.taaInvitations,
          tgsRegistrations: ownMonthlyProgress.tgsRegistrations,
        },
        
        
        // Monthly Progress (für simple-kanzleiablauf-v3) - nur Ist-Zahlen
        monthlyProgress: {
          fa_current: ownMonthlyProgress.fa,
          eh_current: ownMonthlyProgress.eh,
          new_appointments_current: ownMonthlyProgress.newAppointments,
          recommendations_current: ownMonthlyProgress.recommendations,
          tiv_invitations_current: ownMonthlyProgress.tivInvitations,
          bav_checks_current: ownMonthlyProgress.bavChecks,
          taa_invitations_current: ownMonthlyProgress.taaInvitations,
          tgs_registrations_current: ownMonthlyProgress.tgsRegistrations,
        },
        
        // Eigene Wochen-Ist-Zahlen (für "Wochenziele & Wochenist")
        ownWeeklyProgress: {
          fa_current: weeklyProgress.fa_current,
          eh_current: weeklyProgress.eh_current,
          new_appointments_current: weeklyProgress.new_appointments_current,
          recommendations_current: weeklyProgress.recommendations_current,
          tiv_invitations_current: weeklyProgress.tiv_invitations_current,
          bav_checks_current: weeklyProgress.bav_checks_current,
          taa_invitations_current: weeklyProgress.taa_invitations_current,
          tgs_registrations_current: weeklyProgress.tgs_registrations_current,
        },
        
        // Weekly Progress (für simple-kanzleiablauf-v3)
        weeklyProgress: {
          fa_current: weeklyProgress.fa_current,
          eh_current: weeklyProgress.eh_current,
          new_appointments_current: weeklyProgress.new_appointments_current,
          recommendations_current: weeklyProgress.recommendations_current,
          tiv_invitations_current: weeklyProgress.tiv_invitations_current,
          bav_checks_current: weeklyProgress.bav_checks_current,
          taa_invitations_current: weeklyProgress.taa_invitations_current,
          tgs_registrations_current: weeklyProgress.tgs_registrations_current,
        },

        // Current User Info
        currentUser: {
          id: user.id,
          name: user.name,
          team_name: user.team_name || userTeam?.name || 'Kein Team',
          is_team_leader: user.is_team_leader,
          role: user.role,
          personal_targets: user.personal_targets
        },
        
        // Debug: Log currentUser data being sent
        debug_currentUser: {
          id: user.id,
          name: user.name,
          personal_targets: user.personal_targets,
          has_personal_targets: !!user.personal_targets
        },
        // Team Members (nur direkte Team-Mitglieder)
        teamMembers: teamMembers,
        // Subteams (als Gruppen mit aggregierten Daten)
        subteams: subteams,
        teamTotals: teamTotals,
        teamTodayGoals: teamTodayGoals,
        teamWeeklyProgress: teamWeeklyProgress,
        teamMonthlyProgress: teamMonthlyProgress,
        
        // Available Team Views (für Tab-Navigation) - nur Teams mit Untergebenen
        availableTeamViews: [
          // Nur Teams anzeigen, die tatsächlich Untergebene haben
          ...Array.from(new Set([
            // Eigenes Team (nur wenn Untergebene vorhanden)
            ...(directTeamUsers.length > 0 || subteams.length > 0 ? [user.team_name] : []),
            // Teams der direkten Untergebenen (nur wenn sie Team-Leader sind)
            ...directTeamUsers.filter(u => u.is_team_leader).map(u => u.team_name).filter(Boolean),
            // Teams der Subteams
            ...subteams.map(subteam => subteam.teamLeader.team_name).filter(Boolean)
          ])).map(teamName => ({
            id: teamName,
            name: teamName,
            role: 'team'
          }))
        ],
        
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}