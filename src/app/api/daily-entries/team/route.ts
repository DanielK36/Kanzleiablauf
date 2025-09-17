import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';
import { getWeekStartDate } from '@/lib/weekday-logic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const supabase = createSupabaseServerClient();

    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, parent_leader_id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get team members (if user is a leader)
    // Include the leader themselves as they also act as an advisor
    let teamMembers = [];
    if (user.role === 'top_leader' || user.role === 'sub_leader') {
      // Get direct team members
      const { data: directMembers, error: membersError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('parent_leader_id', user.id);

      if (membersError) {
        console.error('Error fetching team members:', membersError);
      }

      // Get the leader themselves
      const { data: leaderData, error: leaderError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('id', user.id)
        .single();

      // Combine leader and team members
      teamMembers = [];
      if (leaderData) {
        teamMembers.push(leaderData);
      }
      if (directMembers) {
        teamMembers = teamMembers.concat(directMembers);
      }
    }

    // Get daily entries for the team
    const memberIds = teamMembers.map(member => member.id);
    if (memberIds.length > 0) {
      // Get today's entries
      const { data: dailyEntries, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .in('user_id', memberIds)
        .eq('entry_date', date)
        .order('created_at', { ascending: false });

      // Get yesterday's entries for results
      const yesterday = new Date(date);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: yesterdayEntries } = await supabase
        .from('daily_entries')
        .select(`
          user_id,
          fa_count,
          eh_count,
          new_appointments,
          recommendations,
          tiv_invitations,
          taa_invitations,
          tgs_registrations,
          bav_checks,
          highlight_yesterday,
          appointments_next_week,
          weekly_improvement
        `)
        .in('user_id', memberIds)
        .eq('entry_date', yesterdayStr);

      // Get weekly progress for each member
      const weekStart = getWeekStartDate(new Date(date));
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const { data: weeklyEntries } = await supabase
        .from('daily_entries')
        .select(`
          user_id,
          fa_count,
          eh_count,
          new_appointments,
          recommendations,
          tiv_invitations,
          taa_invitations,
          tgs_registrations,
          bav_checks
        `)
        .in('user_id', memberIds)
        .gte('entry_date', weekStartStr)
        .lte('entry_date', date);

      // Get monthly progress for each member
      const monthStart = new Date(date);
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data: monthlyEntries } = await supabase
        .from('daily_entries')
        .select(`
          user_id,
          fa_count,
          eh_count,
          new_appointments,
          recommendations,
          tiv_invitations,
          taa_invitations,
          tgs_registrations,
          bav_checks
        `)
        .in('user_id', memberIds)
        .gte('entry_date', monthStartStr)
        .lte('entry_date', date);

      if (entriesError) {
        console.error('Error fetching daily entries:', entriesError);
        return NextResponse.json({ error: 'Failed to fetch daily entries' }, { status: 500 });
      }

      // Helper function to calculate totals for a user
      const calculateUserTotals = (userId: string, entries: any[], type: 'weekly' | 'monthly') => {
        const userEntries = entries.filter(entry => entry.user_id === userId);
        return {
          fa: userEntries.reduce((sum, entry) => sum + (entry.fa_count || 0), 0),
          eh: userEntries.reduce((sum, entry) => sum + (entry.eh_count || 0), 0),
          new_appointments: userEntries.reduce((sum, entry) => sum + (entry.new_appointments || 0), 0),
          recommendations: userEntries.reduce((sum, entry) => sum + (entry.recommendations || 0), 0),
          tiv_invitations: userEntries.reduce((sum, entry) => sum + (entry.tiv_invitations || 0), 0),
          taa_invitations: userEntries.reduce((sum, entry) => sum + (entry.taa_invitations || 0), 0),
          tgs_registrations: userEntries.reduce((sum, entry) => sum + (entry.tgs_registrations || 0), 0),
          bav_checks: userEntries.reduce((sum, entry) => sum + (entry.bav_checks || 0), 0)
        };
      };

      // Get yesterday's data for each user
      const yesterdayData = (yesterdayEntries || []).reduce((acc, entry) => {
        acc[entry.user_id] = entry;
        return acc;
      }, {});

      // Get user data for team members
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('id, name, role, monthly_targets, personal_targets')
        .in('id', memberIds);

      if (userDataError) {
        console.error('Error fetching user data:', userDataError);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
      }

      // Create a map of user data by ID
      const userMap = (userData || []).reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});

      // Format the data for the Kanzleiablauf page
      const formattedEntries = (dailyEntries || []).map(entry => {
        const yesterday = yesterdayData[entry.user_id] || {};
        const user = userMap[entry.user_id] || {};
        const monthlyTargets = user.monthly_targets || {};
        const personalTargets = user.personal_targets || {};
        
        // Calculate weekly and monthly progress
        const weeklyTotals = calculateUserTotals(entry.user_id, weeklyEntries || [], 'weekly');
        const monthlyTotals = calculateUserTotals(entry.user_id, monthlyEntries || [], 'monthly');

        return {
          id: entry.user_id,
          name: user.name,
          role: user.role,
          isTrainee: user.role === 'trainee',
          
          // Yesterday's goals (from personal targets)
          yesterdayGoals: {
            fa_target: personalTargets.fa_daily || 0,
            eh_target: personalTargets.eh_daily || 0,
            new_appointments_target: personalTargets.new_appointments_daily || 0,
            recommendations_target: personalTargets.recommendations_daily || 0,
            tiv_invitations_target: personalTargets.tiv_invitations_daily || 0,
            taa_invitations_target: personalTargets.taa_invitations_daily || 0,
            tgs_registrations_target: personalTargets.tgs_registrations_daily || 0,
            bav_checks_target: personalTargets.bav_checks_daily || 0
          },
          
          // Yesterday's results
          yesterdayResults: {
            fa_achieved: yesterday.fa_count || 0,
            eh_achieved: yesterday.eh_count || 0,
            new_appointments_achieved: yesterday.new_appointments || 0,
            recommendations_achieved: yesterday.recommendations || 0,
            tiv_invitations_achieved: yesterday.tiv_invitations || 0,
            taa_invitations_achieved: yesterday.taa_invitations || 0,
            tgs_registrations_achieved: yesterday.tgs_registrations || 0,
            bav_checks_achieved: yesterday.bav_checks || 0,
            highlight_yesterday: yesterday.highlight_yesterday || '',
            appointments_next_week: yesterday.appointments_next_week || 0,
            weekly_improvement: yesterday.weekly_improvement || ''
          },
          
          // Today's goals
          todayGoals: entry.today_goals || {
            fa_target: personalTargets.fa_daily || 0,
            eh_target: personalTargets.eh_daily || 0,
            new_appointments_target: personalTargets.new_appointments_daily || 0,
            recommendations_target: personalTargets.recommendations_daily || 0,
            tiv_invitations_target: personalTargets.tiv_invitations_daily || 0,
            taa_invitations_target: personalTargets.taa_invitations_daily || 0,
            tgs_registrations_target: personalTargets.tgs_registrations_daily || 0,
            bav_checks_target: personalTargets.bav_checks_daily || 0
          },
          
          // Weekly progress
          weeklyProgress: {
            fa_current: weeklyTotals.fa,
            fa_target: (personalTargets.fa_daily || 0) * 5, // 5 working days
            eh_current: weeklyTotals.eh,
            eh_target: (personalTargets.eh_daily || 0) * 5,
            new_appointments_current: weeklyTotals.new_appointments,
            new_appointments_target: (personalTargets.new_appointments_daily || 0) * 5,
            recommendations_current: weeklyTotals.recommendations,
            recommendations_target: (personalTargets.recommendations_daily || 0) * 5,
            tiv_invitations_current: weeklyTotals.tiv_invitations,
            tiv_invitations_target: (personalTargets.tiv_invitations_daily || 0) * 5,
            taa_invitations_current: weeklyTotals.taa_invitations,
            taa_invitations_target: (personalTargets.taa_invitations_daily || 0) * 5,
            tgs_registrations_current: weeklyTotals.tgs_registrations,
            tgs_registrations_target: (personalTargets.tgs_registrations_daily || 0) * 5,
            bav_checks_current: weeklyTotals.bav_checks,
            bav_checks_target: (personalTargets.bav_checks_daily || 0) * 5
          },
          
          // Monthly progress
          monthlyProgress: {
            fa_current: monthlyTotals.fa,
            fa_target: monthlyTargets.fa_target || 0,
            eh_current: monthlyTotals.eh,
            eh_target: monthlyTargets.eh_target || 0,
            new_appointments_current: monthlyTotals.new_appointments,
            new_appointments_target: monthlyTargets.new_appointments_target || 0,
            recommendations_current: monthlyTotals.recommendations,
            recommendations_target: monthlyTargets.recommendations_target || 0,
            tiv_invitations_current: monthlyTotals.tiv_invitations,
            tiv_invitations_target: monthlyTargets.tiv_invitations_target || 0,
            taa_invitations_current: monthlyTotals.taa_invitations,
            taa_invitations_target: monthlyTargets.taa_invitations_target || 0,
            tgs_registrations_current: monthlyTotals.tgs_registrations,
            tgs_registrations_target: monthlyTargets.tgs_registrations_target || 0,
            bav_checks_current: monthlyTotals.bav_checks,
            bav_checks_target: monthlyTargets.bav_checks_target || 0
          },
          
          // Today's questions and answers
          todayAnswers: {
            help_needed: entry.help_needed || '',
            training_focus: entry.training_focus || '',
            improvement_today: entry.improvement_today || ''
          },
          
          // Today's todos
          todayTodos: entry.today_todos || []
        };
      });

      return NextResponse.json({ 
        success: true, 
        teamMembers: formattedEntries,
        date 
      });
    }

    return NextResponse.json({ 
      success: true, 
      teamMembers: [],
      date 
    });
  } catch (error) {
    console.error('Error in GET /api/daily-entries/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
