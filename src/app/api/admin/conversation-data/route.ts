import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team');

    const supabase = createSupabaseServerClient();

    // Get all teams
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

    // Get this week's daily entries
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { data: dailyEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .gte('entry_date', monday.toISOString().split('T')[0])
      .lte('entry_date', sunday.toISOString().split('T')[0])
      .order('entry_date', { ascending: false });

    if (entriesError) {
      console.error('Error fetching daily entries:', entriesError);
      return NextResponse.json({ error: 'Database error fetching entries' }, { status: 500 });
    }

    // Process data for conversation
    const processedTeams = teams.map(team => {
      const teamMembers = users.filter(user => user.team_name === team.name);
      
      const membersWithData = teamMembers.map(member => {
        const memberEntries = dailyEntries.filter(entry => entry.user_id === member.id);
        
        // Calculate current totals for the week
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
          fa_target: personalTargets.fa_weekly || 0,
          eh_target: personalTargets.eh_weekly || 0,
          new_appointments_target: personalTargets.new_appointments_weekly || 0,
          recommendations_target: personalTargets.recommendations_weekly || 0,
          tiv_invitations_target: personalTargets.tiv_invitations_weekly || 0,
          taa_invitations_target: personalTargets.taa_invitations_weekly || 0,
          tgs_registrations_target: personalTargets.tgs_registrations_weekly || 0,
          bav_checks_target: personalTargets.bav_checks_weekly || 0
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

      return {
        id: team.id.toString(),
        name: team.name,
        members: membersWithData
      };
    });

    // If specific team requested, return only that team's conversation data
    if (teamId) {
      const team = processedTeams.find(t => t.id === teamId);
      if (!team) {
        return NextResponse.json({ error: 'Team not found' }, { status: 404 });
      }

      // In a real implementation, you would load saved conversation notes from a database
      // For now, return empty data
      return NextResponse.json({
        team,
        conversationNotes: {},
        completedTopics: {},
        week: {
          start: monday.toISOString(),
          end: sunday.toISOString()
        }
      });
    }

    return NextResponse.json({
      teams: processedTeams,
      week: {
        start: monday.toISOString(),
        end: sunday.toISOString()
      }
    });

  } catch (error) {
    console.error('Error in conversation data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, conversationNotes, completedTopics } = body;

    // In a real implementation, you would save this to a database
    // For now, just return success
    console.log('Saving conversation data:', { teamId, conversationNotes, completedTopics });

    return NextResponse.json({
      success: true,
      message: 'Conversation data saved successfully'
    });

  } catch (error) {
    console.error('Error saving conversation data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
