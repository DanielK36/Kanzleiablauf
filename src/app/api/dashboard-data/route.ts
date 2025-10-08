import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// Rekursive Funktion um alle Subteam-Mitglieder zu laden
async function getAllSubteamMembers(supabase: any, teamLeaderId: string): Promise<any[]> {
  const allMembers: any[] = [];
  
  // Lade direkte Untergebene
  const { data: directMembers, error } = await supabase
    .from('users')
    .select('id, name, role, team_id, team_name, personal_targets, parent_leader_id, is_team_leader')
    .eq('parent_leader_id', teamLeaderId);
  
  if (error || !directMembers) {
    return allMembers;
  }
  
  // Füge direkte Mitglieder hinzu
  allMembers.push(...directMembers);
  
  // Für jeden direkten Untergebenen: rekursiv nach weiteren Untergebenen suchen
  for (const member of directMembers) {
    const subMembers = await getAllSubteamMembers(supabase, member.id);
    allMembers.push(...subMembers);
  }
  
  return allMembers;
}

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
    const currentDay = monthlyNow.getDate();
    
    // Wenn heute der 1. ist, gehören die Daten noch zum Vormonat
    let monthForCalculation;
    if (currentDay === 1) {
      // Am 1. Oktober gehört der Eintrag noch zum September
      monthForCalculation = new Date(monthlyNow.getFullYear(), monthlyNow.getMonth() - 1, 1);
    } else {
      // Ab dem 2. Oktober beginnt der neue Monat
      monthForCalculation = new Date(monthlyNow.getFullYear(), monthlyNow.getMonth(), 1);
    }
    
    const startOfMonth = new Date(monthForCalculation.getFullYear(), monthForCalculation.getMonth(), 1).toISOString();
    const endOfMonth = new Date(monthForCalculation.getFullYear(), monthForCalculation.getMonth() + 1, 0, 23, 59, 59).toISOString();

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
      console.error('Error loading direct subordinates:', directSubordinatesError);
    } else if (directSubordinates && directSubordinates.length > 0) {
      // User hat direkte Untergebene
      directTeamUsers = directSubordinates.filter(u => !u.is_team_leader);
      const teamLeaders = directSubordinates.filter(u => u.is_team_leader);
      
      // Für jeden Team-Leader: Subteam-Mitglieder laden (rekursiv)
      for (const teamLeader of teamLeaders) {
        const allSubteamMembers = await getAllSubteamMembers(supabase, teamLeader.id);
        
        subteams.push({
          teamLeader: teamLeader,
          members: allSubteamMembers,
          isSubteam: true
        });
      }
    } else {
      // User hat keine direkten Untergebenen - zeige nur sich selbst
      directTeamUsers = [];
      subteams = [];
    }
    

    // 8.1. Team Goals aus aktueller User's personal_targets laden (nicht mehr Admin)

    // directTeamUsersError wird jetzt oben behandelt

    // 9. Team Monats-Ist-Zahlen berechnen (für "Orga Monatsziele")
    // WICHTIG: Alle Team-Mitglieder inklusive Subteams sammeln (wie bei teamTotals)
    const allTeamUserIds = [];
    const processedUserIdsForMonthly = new Set();
    
    // 1. Direct Team Users hinzufügen
    if (directTeamUsers) {
      for (const user of directTeamUsers) {
        if (!processedUserIdsForMonthly.has(user.id) && !user.is_team_leader) {
          allTeamUserIds.push(user.id);
          processedUserIdsForMonthly.add(user.id);
        }
      }
    }
    
    // 2. Current User hinzufügen (falls noch nicht hinzugefügt)
    if (user && !processedUserIdsForMonthly.has(user.id)) {
      const isAlreadyTeamLeader = subteams.some(subteam => subteam.teamLeader.id === user.id);
      if (!isAlreadyTeamLeader) {
        allTeamUserIds.push(user.id);
        processedUserIdsForMonthly.add(user.id);
      }
    }
    
    // 3. Subteam-Mitglieder hinzufügen
    if (subteams) {
      for (const subteam of subteams) {
        // Team-Leader hinzufügen
        if (!processedUserIdsForMonthly.has(subteam.teamLeader.id)) {
          allTeamUserIds.push(subteam.teamLeader.id);
          processedUserIdsForMonthly.add(subteam.teamLeader.id);
        }
        // Subteam-Mitglieder hinzufügen
        if (subteam.members) {
          for (const member of subteam.members) {
            if (!processedUserIdsForMonthly.has(member.id)) {
              allTeamUserIds.push(member.id);
              processedUserIdsForMonthly.add(member.id);
            }
          }
        }
      }
    }
    
    const { data: teamDailyEntries, error: teamDailyEntriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .in('user_id', allTeamUserIds)
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
    

    // Lade Team-Mitglieder basierend auf User-Rolle
    let allTeamMembersBasedOnTeamName = [];
    let allTeamMembersError = null;
    
    if (user.role === 'admin') {
      // Admins sehen alle Teams
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role, team_id, team_name, personal_targets, parent_leader_id, is_team_leader')
        .not('team_name', 'is', null);
      
      allTeamMembersBasedOnTeamName = data || [];
      allTeamMembersError = error;
    } else {
      // Nicht-Admins sehen ihre Hierarchie + alle Team-Mitglieder mit derselben team_name
      const hierarchyUsers = [
        user, // Current user
        ...directTeamUsers, // Direct subordinates
        ...subteams.flatMap(subteam => [subteam.teamLeader, ...subteam.members]) // Subteam members
      ];
      
      // Zusätzlich: Alle User mit derselben team_name laden
      const { data: sameTeamUsers, error: sameTeamError } = await supabase
        .from('users')
        .select('id, name, role, team_id, team_name, personal_targets, parent_leader_id, is_team_leader')
        .eq('team_name', user.team_name);
      
      if (sameTeamUsers) {
        // Kombiniere Hierarchie + Team-Mitglieder (ohne Duplikate)
        const allUsers = [...hierarchyUsers];
        const existingIds = new Set(hierarchyUsers.map(u => u.id));
        
        for (const teamUser of sameTeamUsers) {
          if (!existingIds.has(teamUser.id)) {
            allUsers.push(teamUser);
            existingIds.add(teamUser.id);
          }
        }
        
        allTeamMembersBasedOnTeamName = allUsers;
      } else {
        allTeamMembersBasedOnTeamName = hierarchyUsers;
      }
      
    }

    // 10. Team Members mit Daten aufbauen
    const teamMembers = [];
    
    // Alle Team-Mitglieder sammeln: ALLE TEAM MITGLIEDERN statt nur direkte
    const allTeamUsers = [];
    const processedUserIds2 = new Set(); // Duplikate vermeiden
    
    // 1. ALLE Team-Mitglieder hinzufügen basierend auf team_name
    if (allTeamMembersBasedOnTeamName) {
      for (const user of allTeamMembersBasedOnTeamName) {
        if (!processedUserIds2.has(user.id)) {
          allTeamUsers.push(user);
          processedUserIds2.add(user.id);
        }
      }
    }
    
    // 1.1. Erweitere um direkte Untergebene für Hierarchie-Zwecke
    if (directTeamUsers) {
      for (const user of directTeamUsers) {
        if (!processedUserIds2.has(user.id)) {
          allTeamUsers.push(user);
          processedUserIds2.add(user.id);
        }
      }
    }
    
    // 1.5. Current User hinzufügen (falls noch nicht hinzugefügt)
    // ABER: Wenn currentUser als team_leader in subteams ist, nicht doppelt hinzufügen
    if (currentUser && !processedUserIds2.has(currentUser.id)) {
      // Prüfe ob currentUser bereits als team_leader in subteams ist
      const isAlreadyTeamLeader = subteams.some(subteam => subteam.teamLeader.id === currentUser.id);
      
      if (!isAlreadyTeamLeader) {
        allTeamUsers.push(currentUser);
        processedUserIds2.add(currentUser.id);
      } else {
      }
    }
    
    // 3. Subteam-Mitglieder hinzufügen
    if (subteams) {
      for (const subteam of subteams) {
        // Team-Leader hinzufügen (falls noch nicht hinzugefügt)
        if (!processedUserIds2.has(subteam.teamLeader.id)) {
          allTeamUsers.push(subteam.teamLeader);
          processedUserIds2.add(subteam.teamLeader.id);
        }
        // Subteam-Mitglieder hinzufügen
        if (subteam.members) {
          for (const member of subteam.members) {
            if (!processedUserIds2.has(member.id)) {
              allTeamUsers.push(member);
              processedUserIds2.add(member.id);
            }
          }
        }
      }
    }
    
    
    
    // Debug: Log all team users to verify completeness
    console.log('🔍 DEBUG - All Team Users:', {
      count: allTeamUsers.length,
      users: allTeamUsers.map(u => ({ id: u.id, name: u.name, team_name: u.team_name })),
      subteams: subteams.map(st => ({ 
        teamLeader: st.teamLeader.name, 
        membersCount: st.members?.length || 0 
      }))
    });
    
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
      const todayEntry = userDailyEntries?.find(entry => entry.entry_date === todayStr); // HEUTE's Eintrag NUR für todayGoals
      const latestEntry = userDailyEntries?.[0]; // Neuester Eintrag für other data

      

      // Yesterday Results (NUR aus yesterdayEntry, nicht latestEntry)
      const yesterdayResults = {
        fa_actual: yesterdayEntry ? (yesterdayEntry?.fa_count || 0) : 0,
        eh_actual: yesterdayEntry ? (yesterdayEntry?.eh_count || 0) : 0,
        new_appointments_actual: yesterdayEntry ? (yesterdayEntry?.new_appointments || 0) : 0,
        recommendations_actual: yesterdayEntry ? (yesterdayEntry?.recommendations || 0) : 0,
        tiv_invitations_actual: yesterdayEntry ? (yesterdayEntry?.tiv_invitations || 0) : 0,
        bav_checks_actual: yesterdayEntry ? (yesterdayEntry?.bav_checks || 0) : 0,
        taa_invitations_actual: yesterdayEntry ? (yesterdayEntry?.taa_invitations || 0) : 0,
        tgs_registrations_actual: yesterdayEntry ? (yesterdayEntry?.tgs_registrations || 0) : 0,
        todos_completed: yesterdayEntry && Array.isArray(yesterdayEntry?.todos_completed) 
          ? yesterdayEntry.todos_completed
          : [],
        // GESTERN'S Todos aus yesterdayEntry
        todos: Array.isArray(yesterdayEntry?.today_todos) ? yesterdayEntry.today_todos : [],
        mood_feedback: yesterdayEntry ? (yesterdayEntry?.mood_feedback || '') : '',
        // Fragen-Antworten von gestern
        highlight_yesterday: yesterdayEntry ? (yesterdayEntry?.highlight_yesterday || '') : '',
        appointments_next_week: yesterdayEntry ? (yesterdayEntry?.appointments_next_week || 0) : 0,
        improvement_today: yesterdayEntry ? (yesterdayEntry?.improvement_today || '') : '',
        weekly_improvement: yesterdayEntry ? (yesterdayEntry?.weekly_improvement || '') : '',
        charisma_training: yesterdayEntry ? (yesterdayEntry?.charisma_training || false) : false,
      };

      // Personal Targets für Weekly/Monthly Goals
      const personalTargets = teamUser.personal_targets || {};

      // Yesterday Goals (Ziele aus gestrigem Eintrag, nur wenn aktuell)
      const yesterdayGoals = {
        // Gestrige Ziele KORREKT laden:
        // Wenn gestriger Eintrag existiert: verwende exakte Werte (auch 0!)
        // Wenn kein gestriger Eintrag: verwende 0 als Fallback
        fa_daily_target: yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr ? 
          yesterdayEntry.fa_daily_target : 0,
        eh_daily_target: yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr ? 
          yesterdayEntry.eh_daily_target : 0,
        new_appointments_daily_target: yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr ? 
          yesterdayEntry.new_appointments_daily_target : 0,
        recommendations_daily_target: yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr ? 
          yesterdayEntry.recommendations_daily_target : 0,
        tiv_invitations_daily_target: yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr ? 
          yesterdayEntry.tiv_invitations_daily_target : 0,
        bav_checks_daily_target: yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr ? 
          yesterdayEntry.bav_checks_daily_target : 0,
        taa_invitations_daily_target: yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr ? 
          yesterdayEntry.taa_invitations_daily_target : 0,
        tgs_registrations_daily_target: yesterdayEntry && yesterdayEntry.entry_date === yesterdayStr ? 
          yesterdayEntry.tgs_registrations_daily_target : 0,
      };

      // Today Goals (NUR aus heute's Eintrag, oder 0 wenn kein heutiger Eintrag)
      const todayGoals = {
        fa_daily_target: todayEntry ? (todayEntry.fa_daily_target || 0) : 0,
        eh_daily_target: todayEntry ? (todayEntry.eh_daily_target || 0) : 0,
        new_appointments_daily_target: todayEntry ? (todayEntry.new_appointments_daily_target || 0) : 0,
        recommendations_daily_target: todayEntry ? (todayEntry.recommendations_daily_target || 0) : 0,
        tiv_invitations_daily_target: todayEntry ? (todayEntry.tiv_invitations_daily_target || 0) : 0,
        bav_checks_daily_target: todayEntry ? (todayEntry.bav_checks_daily_target || 0) : 0,
        taa_invitations_daily_target: todayEntry ? (todayEntry.taa_invitations_daily_target || 0) : 0,
        tgs_registrations_daily_target: todayEntry ? (todayEntry.tgs_registrations_daily_target || 0) : 0,
      };

      // Today Answers (NUR aus todayEntry, nicht latestEntry)
      const todayAnswers = {
        help_needed: todayEntry?.help_needed || '',
        training_focus: todayEntry?.training_focus || '',
        improvement_today: todayEntry?.improvement_today || '',
        weekday_answers: todayEntry?.weekday_answers || {},
        // Spezifische Antworten auf Fragen basierend auf Index
        question_0: todayEntry?.weekday_answers?.[0] || '',
        question_1: todayEntry?.weekday_answers?.[1] || '',
        question_2: todayEntry?.weekday_answers?.[2] || '',
        question_3: todayEntry?.weekday_answers?.[3] || '',
      };

      // Today Todos (NUR aus todayEntry, nicht latestEntry)
      const todayTodos = Array.isArray(todayEntry?.today_todos) 
        ? todayEntry.today_todos.filter(Boolean)
        : [];

      // Today Actuals (Heute's Ist-Zahlen NUR aus todayEntry)
      const todayActuals = {
        fa_actual: todayEntry ? (todayEntry.fa_count || 0) : 0,
        eh_actual: todayEntry ? (todayEntry.eh_count || 0) : 0,
        new_appointments_actual: todayEntry ? (todayEntry.new_appointments || 0) : 0,
        recommendations_actual: todayEntry ? (todayEntry.recommendations || 0) : 0,
        tiv_invitations_actual: todayEntry ? (todayEntry.tiv_invitations || 0) : 0,
        bav_checks_actual: todayEntry ? (todayEntry.bav_checks || 0) : 0,
        taa_invitations_actual: todayEntry ? (todayEntry.taa_invitations || 0) : 0,
        tgs_registrations_actual: todayEntry ? (todayEntry.tgs_registrations || 0) : 0,
      };

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

      teamMembers.push({
        id: teamUser.id,
        name: teamUser.name,
        firstName: teamUser.name?.split(' ')[0],
        role: teamUser.role,
        isTrainee: teamUser.role === 'trainee',
        team_name: teamUser.team_name, // WICHTIG: team_name hinzufügen
        personalTargets: teamUser.personal_targets, // WICHTIG: personalTargets hinzufügen (camelCase)
        yesterdayResults,
        yesterdayGoals,
        todayGoals,
        todayActuals, // Heute's Ist-Zahlen hinzugefügt
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

    // Team Weekly Progress berechnen - nur teamMembers (da die die richtige Datenstruktur haben)
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

    // HEUTE's Team Goals: nur teamMembers (da die die richtige Datenstruktur haben)
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
          personalTargets: user.personal_targets
        },
        
        // Debug: Log currentUser data being sent
        debug_currentUser: {
          id: user.id,
          name: user.name,
          personalTargets: user.personal_targets,
          hasPersonalTargets: !!user.personal_targets
        },
        // Team Members (nur direkte Team-Mitglieder)
        teamMembers: teamMembers,
        // Subteams (als Gruppen mit aggregierten Daten)
        subteams: subteams,
        teamTotals: teamTotals,
        teamTodayGoals: teamTodayGoals,
        teamWeeklyProgress: teamWeeklyProgress,
        teamMonthlyProgress: teamMonthlyProgress,
        
        // Available Team Views (für Tab-Navigation) - basierend auf User-Rolle
        availableTeamViews: (() => {
          if (user.role === 'admin') {
            // Admins sehen alle Teams
            return [
              // Alle Teams zeigen die User haben (Team-Leader oder User)
              ...Array.from(new Set([
                // Eigenes Team immer anzeigen
                user.team_name,
                // Teams aller teamMembers
                ...teamMembers.map(u => u.team_name).filter(Boolean),
                // Teams der direkten Untergebenen
                ...directTeamUsers.filter(u => u.is_team_leader).map(u => u.team_name).filter(Boolean),
                // Teams der Subteams
                ...subteams.map(subteam => subteam.teamLeader.team_name).filter(Boolean)
              ])).filter(Boolean).map(teamName => ({
                id: teamName,
                name: teamName,
                role: 'team'
              }))
            ];
          } else {
            // Nicht-Admins sehen nur ihr eigenes Team
            return [{
              id: user.team_name,
              name: user.team_name,
              role: 'team'
            }].filter(team => team.name);
          }
        })(),
        
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}