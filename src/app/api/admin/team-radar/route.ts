import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'weekly';

    const supabase = createSupabaseServerClient();

    // Get all teams with their members
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .order('team_level, name');

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return NextResponse.json({ error: 'Database error fetching teams' }, { status: 500 });
    }

    // Get all users with their personal targets
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, team_name, role, personal_targets')
      .order('team_name, name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Database error fetching users' }, { status: 500 });
    }

    // Get daily entries for the current period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (timeframe === 'weekly') {
      // Current week (Monday to Sunday)
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      startDate = monday;
      endDate = sunday;
    } else {
      // Current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const { data: dailyEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .lte('entry_date', endDate.toISOString().split('T')[0])
      .order('entry_date', { ascending: false });

    if (entriesError) {
      console.error('Error fetching daily entries:', entriesError);
      return NextResponse.json({ error: 'Database error fetching entries' }, { status: 500 });
    }

    // Process data into radar format
    const processedTeams = teams.map(team => {
      const teamMembers = users.filter(user => user.team_name === team.name);
      
      const membersWithData = teamMembers.map(member => {
        const memberEntries = dailyEntries.filter(entry => entry.user_id === member.id);
        
        // Calculate current totals for the period
        const totals = memberEntries.reduce((acc, entry) => ({
          fa: acc.fa + (entry.fa_count || 0),
          eh: acc.eh + (entry.eh_count || 0),
          new_appointments: acc.new_appointments + (entry.new_appointments || 0),
          recommendations: acc.recommendations + (entry.recommendations || 0),
          tiv_invitations: acc.tiv_invitations + (entry.tiv_invitations || 0),
          taa_invitations: acc.taa_invitations + (entry.taa_invitations || 0),
          tgs_registrations: acc.tgs_registrations + (entry.tgs_registrations || 0),
          bav_checks: acc.bav_checks + (entry.bav_checks || 0)
        }), {
          fa: 0, eh: 0, new_appointments: 0, recommendations: 0,
          tiv_invitations: 0, taa_invitations: 0, tgs_registrations: 0, bav_checks: 0
        });

        // Get targets from personal_targets
        const personalTargets = member.personal_targets || {};
        const targets = {
          fa_target: personalTargets[timeframe === 'weekly' ? 'fa_weekly' : 'fa_monthly_target'] || 0,
          eh_target: personalTargets[timeframe === 'weekly' ? 'eh_weekly' : 'eh_monthly_target'] || 0,
          new_appointments_target: personalTargets[timeframe === 'weekly' ? 'new_appointments_weekly' : 'new_appointments_monthly_target'] || 0,
          recommendations_target: personalTargets[timeframe === 'weekly' ? 'recommendations_weekly' : 'recommendations_monthly_target'] || 0,
          tiv_invitations_target: personalTargets[timeframe === 'weekly' ? 'tiv_invitations_weekly' : 'tiv_invitations_monthly_target'] || 0,
          taa_invitations_target: personalTargets[timeframe === 'weekly' ? 'taa_invitations_weekly' : 'taa_invitations_monthly_target'] || 0,
          tgs_registrations_target: personalTargets[timeframe === 'weekly' ? 'tgs_registrations_weekly' : 'tgs_registrations_monthly_target'] || 0,
          bav_checks_target: personalTargets[timeframe === 'weekly' ? 'bav_checks_weekly' : 'bav_checks_monthly_target'] || 0
        };

        // Get latest entry for highlights
        const latestEntry = memberEntries[0];
        
        return {
          id: member.id,
          name: member.name,
          team_name: member.team_name,
          role: member.role,
          personal_targets: personalTargets,
          weekly_progress: { ...totals, ...targets },
          monthly_progress: { ...totals, ...targets },
          daily_entries: memberEntries,
          highlight_yesterday: latestEntry?.highlight_yesterday,
          help_needed: latestEntry?.help_needed,
          improvement_today: latestEntry?.improvement_today
        };
      });

      // Calculate team totals
      const teamTotals = membersWithData.reduce((acc, member) => {
        const progress = timeframe === 'weekly' ? member.weekly_progress : member.monthly_progress;
        return {
          fa: acc.fa + progress.fa,
          eh: acc.eh + progress.eh,
          new_appointments: acc.new_appointments + progress.new_appointments,
          recommendations: acc.recommendations + progress.recommendations,
          tiv_invitations: acc.tiv_invitations + progress.tiv_invitations,
          taa_invitations: acc.taa_invitations + progress.taa_invitations,
          tgs_registrations: acc.tgs_registrations + progress.tgs_registrations,
          bav_checks: acc.bav_checks + progress.bav_checks,
          fa_target: acc.fa_target + progress.fa_target,
          eh_target: acc.eh_target + progress.eh_target,
          new_appointments_target: acc.new_appointments_target + progress.new_appointments_target,
          recommendations_target: acc.recommendations_target + progress.recommendations_target,
          tiv_invitations_target: acc.tiv_invitations_target + progress.tiv_invitations_target,
          taa_invitations_target: acc.taa_invitations_target + progress.taa_invitations_target,
          tgs_registrations_target: acc.tgs_registrations_target + progress.tgs_registrations_target,
          bav_checks_target: acc.bav_checks_target + progress.bav_checks_target
        };
      }, {
        fa: 0, eh: 0, new_appointments: 0, recommendations: 0,
        tiv_invitations: 0, taa_invitations: 0, tgs_registrations: 0, bav_checks: 0,
        fa_target: 0, eh_target: 0, new_appointments_target: 0, recommendations_target: 0,
        tiv_invitations_target: 0, taa_invitations_target: 0, tgs_registrations_target: 0, bav_checks_target: 0
      });

      return {
        id: team.id.toString(),
        name: team.name,
        members: membersWithData,
        weekly_totals: teamTotals,
        monthly_totals: teamTotals
      };
    });

    // Calculate overall stats
    const overallStats = processedTeams.reduce((acc, team) => {
      const totals = timeframe === 'weekly' ? team.weekly_totals : team.monthly_totals;
      return {
        fa: acc.fa + totals.fa,
        eh: acc.eh + totals.eh,
        new_appointments: acc.new_appointments + totals.new_appointments,
        recommendations: acc.recommendations + totals.recommendations,
        tiv_invitations: acc.tiv_invitations + totals.tiv_invitations,
        taa_invitations: acc.taa_invitations + totals.taa_invitations,
        tgs_registrations: acc.tgs_registrations + totals.tgs_registrations,
        bav_checks: acc.bav_checks + totals.bav_checks,
        fa_target: acc.fa_target + totals.fa_target,
        eh_target: acc.eh_target + totals.eh_target,
        new_appointments_target: acc.new_appointments_target + totals.new_appointments_target,
        recommendations_target: acc.recommendations_target + totals.recommendations_target,
        tiv_invitations_target: acc.tiv_invitations_target + totals.tiv_invitations_target,
        taa_invitations_target: acc.taa_invitations_target + totals.taa_invitations_target,
        tgs_registrations_target: acc.tgs_registrations_target + totals.tgs_registrations_target,
        bav_checks_target: acc.bav_checks_target + totals.bav_checks_target
      };
    }, {
      fa: 0, eh: 0, new_appointments: 0, recommendations: 0,
      tiv_invitations: 0, taa_invitations: 0, tgs_registrations: 0, bav_checks: 0,
      fa_target: 0, eh_target: 0, new_appointments_target: 0, recommendations_target: 0,
      tiv_invitations_target: 0, taa_invitations_target: 0, tgs_registrations_target: 0, bav_checks_target: 0
    });

    return NextResponse.json({
      teams: processedTeams,
      overall_stats: overallStats,
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error in team radar API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
