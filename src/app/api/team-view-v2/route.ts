import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // 'leader' | 'admin'
    const teamName = searchParams.get('team'); // 'Hurricane' | null
    const includeHierarchy = searchParams.get('include_hierarchy') === 'true';

    const supabase = createSupabaseServerClient();

    // 1. Load current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*, personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // 2. Determine which users to load based on parameters
    let targetUsers: any[] = [];
    let teamViewName = 'Eigene Ansicht';

    if (teamName && teamName !== 'all') {
      // Specific team requested (e.g., Hurricane)
      const { data: teamUsers, error: teamError } = await supabase
        .from('users')
        .select('*, personal_targets')
        .eq('team_name', teamName);

      if (!teamError && teamUsers) {
        targetUsers = teamUsers;
        teamViewName = `Team ${teamName}`;
        
        // Optionally include hierarchies (but avoid duplicates)
        if (includeHierarchy) {
          // Load users who report to anyone in this team
          const teamUserIds = teamUsers.map(u => u.id);
          const { data: hierarchyUsers, error: hierarchyError } = await supabase
            .from('users')
            .select('*, personal_targets')
            .in('parent_leader_id', teamUserIds);
            
          if (!hierarchyError && hierarchyUsers) {
            // Remove duplicates by user ID
            const existingIds = new Set(teamUsers.map(u => u.id));
            const uniqueHierarchyUsers = hierarchyUsers.filter(u => !existingIds.has(u.id));
            targetUsers = [...teamUsers, ...uniqueHierarchyUsers];
          }
        }
      }
    } else if (role === 'leader') {
      // Load only direct reports (hierarchy-based)
      const { data: directReports, error: reportsError } = await supabase
        .from('users')
        .select('*, personal_targets')
        .eq('parent_leader_id', currentUser.id);

      if (!reportsError && directReports) {
        targetUsers = directReports;
        teamViewName = `Meine Untergebenen`;
      }
    } else {
      // Default: admin view - show all users in current user's team + hierarchies
      const { data: teamUsers, error: teamError } = await supabase
        .from('users')
        .select('*, personal_targets')
        .eq('team_name', currentUser.team_name);

      if (!teamError && teamUsers) {
        targetUsers = teamUsers;
        teamViewName = `Team ${currentUser.team_name}`;
        
        // Include hierarchy (avoid duplicates)
        const teamUserIds = teamUsers.map(u => u.id);
        const { data: hierarchyUsers, error: hierarchyError } = await supabase
          .from('users')
          .select('*, personal_targets')
          .in('parent_leader_id', teamUserIds);
          
        if (!hierarchyError && hierarchyUsers) {
          const existingIds = new Set(teamUsers.map(u => u.id));
          const uniqueHierarchyUsers = hierarchyUsers.filter(u => !existingIds.has(u.id));
          targetUsers = [...teamUsers, ...uniqueHierarchyUsers];
        }
      }
    }

    // 3. Get available teams for navigation
    const { data: allTeams, error: teamsError } = await supabase
      .from('users')
      .select('team_name')
      .not('team_name', 'is', null)
      .neq('team_name', '');

    const availableTeams = Array.from(new Set(
      allTeams?.map(u => u.team_name).filter(Boolean) || []
    )).map(teamName => ({
      id: teamName,
      name: `Team ${teamName}`,
      role: 'team'
    }));

    // 4. Load daily entries and calculate metrics for target users
    const userIds = targetUsers.map(u => u.id);
    
    // Get last 30 days of entries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: dailyEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*, personal_targets')
      .in('user_id', userIds)
      .gte('entry_date', thirtyDaysAgoStr)
      .order('entry_date', { ascending: false });

    if (entriesError) {
      console.error('Error loading daily entries:', entriesError);
    }

    // 5. Transform users with their daily data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const usersWithData = targetUsers.map(user => {
      // Find user's entries
      const userEntries = dailyEntries?.filter(entry => entry.user_id === user.id) || [];
      
      // Get specific entries
      const todayEntry = userEntries.find(entry => entry.entry_date === todayStr);
      const yesterdayEntry = userEntries.find(entry => entry.entry_date === yesterdayStr);
      const latestEntry = userEntries[0];

      // Calculate metrics
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

      const yesterdayGoals = {
        fa_daily_target: yesterdayEntry ? (yesterdayEntry.fa_daily_target || 0) : 0,
        eh_daily_target: yesterdayEntry ? (yesterdayEntry.eh_daily_target || 0) : 0,
        new_appointments_daily_target: yesterdayEntry ? (yesterdayEntry.new_appointments_daily_target || 0) : 0,
        recommendations_daily_target: yesterdayEntry ? (yesterdayEntry.recommendations_daily_target || 0) : 0,
        tiv_invitations_daily_target: yesterdayEntry ? (yesterdayEntry.tiv_invitations_daily_target || 0) : 0,
        bav_checks_daily_target: yesterdayEntry ? (yesterdayEntry.bav_checks_daily_target || 0) : 0,
        taa_invitations_daily_target: yesterdayEntry ? (yesterdayEntry.taa_invitations_daily_target || 0) : 0,
        tgs_registrations_daily_target: yesterdayEntry ? (yesterdayEntry.tgs_registrations_daily_target || 0) : 0,
      };

      const yesterdayResults = {
        fa_actual: yesterdayEntry ? (yesterdayEntry.fa_actual || 0) : 0,
        eh_actual: yesterdayEntry ? (yesterdayEntry.eh_actual || 0) : 0,
        new_appointments_actual: yesterdayEntry ? (yesterdayEntry.new_appointments_actual || 0) : 0,
        recommendations_actual: yesterdayEntry ? (yesterdayEntry.recommendations_actual || 0) : 0,
        tiv_invitations_actual: yesterdayEntry ? (yesterdayEntry.tiv_invitations_actual || 0) : 0,
        bav_checks_actual: yesterdayEntry ? (yesterdayEntry.bav_checks_actual || 0) : 0,
        taa_invitations_actual: yesterdayEntry ? (yesterdayEntry.taa_invitations_actual || 0) : 0,
        tgs_registrations_actual: yesterdayEntry ? (yesterdayEntry.tgs_registrations_actual || 0) : 0,
        todos: yesterdayEntry?.todos || [],
        mood_feedback: yesterdayEntry?.mood_feedback || '',
        highlight_yesterday: yesterdayEntry?.highlight_yesterday || '',
        appointments_next_week: yesterdayEntry?.appointments_next_week || 0,
        weekly_improvement: yesterdayEntry?.weekly_improvement || '',
        charisma_training: yesterdayEntry?.charisma_training || false,
      };

      // Aggregate weekly progress from entries (last 7 days)
      const weeklyTargets = {
        fa_weekly_target: latestEntry ? (latestEntry.fa_weekly_target || 0) : 0,
        eh_weekly_target: latestEntry ? (latestEntry.eh_weekly_target || 0) : 0,
        new_appointments_weekly_target: latestEntry ? (latestEntry.new_appointments_weekly_target || 0) : 0,
        recommendations_weekly_target: latestEntry ? (latestEntry.recommendations_weekly_target || 0) : 0,
        tiv_invitations_weekly_target: latestEntry ? (latestEntry.tiv_invitations_weekly_target || 0) : 0,
        bav_checks_weekly_target: latestEntry ? (latestEntry.bav_checks_weekly_target || 0) : 0,
        taa_invitations_weekly_target: latestEntry ? (latestEntry.taa_invitations_weekly_target || 0) : 0,
        tgs_registrations_weekly_target: latestEntry ? (latestEntry.tgs_registrations_weekly_target || 0) : 0,
      };

      // Sum actual values from daily entries (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const weeklyActuals = {
        fa_actual: 0,
        eh_actual: 0,
        new_appointments_actual: 0,
        recommendations_actual: 0,
        tiv_invitations_actual: 0,
        bav_checks_actual: 0,
        taa_invitations_actual: 0,
        tgs_registrations_actual: 0,
      };

      // Sum up last 7 days of daily entries
      const weeklyEntries = userEntries.filter(entry => entry.entry_date >= weekAgoStr);
      weeklyEntries.forEach(entry => {
        weeklyActuals.fa_actual += entry.fa_actual || 0;
        weeklyActuals.eh_actual += entry.eh_actual || 0;
        weeklyActuals.new_appointments_actual += entry.new_appointments_actual || 0;
        weeklyActuals.recommendations_actual += entry.recommendations_actual || 0;
        weeklyActuals.tiv_invitations_actual += entry.tiv_invitations_actual || 0;
        weeklyActuals.bav_checks_actual += entry.bav_checks_actual || 0;
        weeklyActuals.taa_invitations_actual += entry.taa_invitations_actual || 0;
        weeklyActuals.tgs_registrations_actual += entry.tgs_registrations_actual || 0;
      });

      const weeklyProgress = {
        ...weeklyTargets,
        ...weeklyActuals,
      };

      // Monthly progress from personal_targets
      const monthlyProgress = {
        fa_monthly_target: user.personal_targets?.fa_monthly_target || 0,
        fa_actual: weeklyActuals.fa_actual, // Sum of all daily entries
        eh_monthly_target: user.personal_targets?.eh_monthly_target || 0,
        eh_actual: weeklyActuals.eh_actual,
        new_appointments_monthly_target: user.personal_targets?.new_appointments_monthly_target || 0,
        new_appointments_actual: weeklyActuals.new_appointments_actual,
        recommendations_monthly_target: user.personal_targets?.recommendations_monthly_target || 0,
        recommendations_actual: weeklyActuals.recommendations_actual,
        tiv_invitations_monthly_target: user.personal_targets?.tiv_invitations_monthly_target || 0,
        tiv_invitations_actual: weeklyActuals.tiv_invitations_actual,
        bav_checks_monthly_target: user.personal_targets?.bav_checks_monthly_target || 0,
        bav_checks_actual: weeklyActuals.bav_checks_actual,
        taa_invitations_monthly_target: user.personal_targets?.taa_invitations_monthly_target || 0,
        taa_invitations_actual: weeklyActuals.taa_invitations_actual,
        tgs_registrations_monthly_target: user.personal_targets?.tgs_registrations_monthly_target || 0,
        tgs_registrations_actual: weeklyActuals.tgs_registrations_actual,
      };

      return {
        id: user.id,
        name: user.name,
        firstName: user.first_name,
        role: user.role,
        teamName: user.team_name,
        isTrainee: user.role === 'trainee',
        isTeamLeader: user.is_team_leader,
        todayGoals,
        yesterdayGoals,
        yesterdayResults,
        weeklyProgress,
        monthlyProgress
      };
    });

    // 6. Calculate team totals
    const teamTotalGoals = {
      fa_daily_target: 0,
      eh_daily_target: 0,
      new_appointments_daily_target: 0,
      recommendations_daily_target: 0,
      tiv_invitations_daily_target: 0,
      bav_checks_daily_target: 0,
      taa_invitations_daily_target: 0,
      tgs_registrations_daily_target: 0,
    };

    const teamYesterdayGoals = {
      fa_daily_target: 0,
      eh_daily_target: 0,
      new_appointments_daily_target: 0,
      recommendations_daily_target: 0,
      tiv_invitations_daily_target: 0,
      bav_checks_daily_target: 0,
      taa_invitations_daily_target: 0,
      tgs_registrations_daily_target: 0,
    };

    const teamYesterdayResults = {
      fa_actual: 0,
      eh_actual: 0,
      new_appointments_actual: 0,
      recommendations_actual: 0,
      tiv_invitations_actual: 0,
      bav_checks_actual: 0,
      taa_invitations_actual: 0,
      tgs_registrations_actual: 0,
    };

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

    usersWithData.forEach(user => {
      // Sum today goals  
      Object.keys(teamTotalGoals).forEach(key => {
        teamTotalGoals[key as keyof typeof teamTotalGoals] += user.todayGoals[key as keyof typeof user.todayGoals];
      });

      // Sum yesterday goals
      Object.keys(teamYesterdayGoals).forEach(key => {
        teamYesterdayGoals[key as keyof typeof teamYesterdayGoals] += user.yesterdayGoals[key as keyof typeof user.yesterdayGoals];
      });

      // Sum yesterday results  
      Object.keys(teamYesterdayResults).forEach(key => {
        teamYesterdayResults[key as keyof typeof teamYesterdayResults] += user.yesterdayResults[key as keyof typeof user.yesterdayResults] as number;
      });

      // Sum weekly progress
      Object.keys(teamWeeklyProgress).forEach(key => {
        const value = user.weeklyProgress[key as keyof typeof user.weeklyProgress];
        if (typeof value === 'number') {
          teamWeeklyProgress[key as keyof typeof teamWeeklyProgress] += value;
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        currentUser,
        teamViewName,
        teamMembers: usersWithData,
        teamTotalGoals,
        teamYesterdayGoals,
        teamYesterdayResults,
        teamWeeklyProgress,
        availableTeams: [
          { id: 'mine', name: 'Meine Untergebenen', role: 'leader' },
          { id: 'all', name: 'Alle Teams', role: 'admin' },
          ...availableTeams
        ],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Team View V2 Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
