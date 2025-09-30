import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
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

    // Get today's daily entries
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyEntries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('entry_date', today)
      .order('created_at', { ascending: false });

    if (entriesError) {
      console.error('Error fetching daily entries:', entriesError);
      return NextResponse.json({ error: 'Database error fetching entries' }, { status: 500 });
    }

    // Process data for leadership conversation
    const processedTeams = teams.map(team => {
      const teamMembers = users.filter(user => user.team_name === team.name);
      
      const membersWithData = teamMembers.map(member => {
        const memberEntries = dailyEntries.filter(entry => entry.user_id === member.id);
        
        return {
          id: member.id,
          name: member.name,
          team_name: member.team_name,
          role: member.role,
          daily_entries: memberEntries,
          personal_targets: member.personal_targets || {}
        };
      });

      return {
        id: team.id.toString(),
        name: team.name,
        members: membersWithData
      };
    });

    return NextResponse.json({
      teams: processedTeams,
      date: today,
      total_entries: dailyEntries.length
    });

  } catch (error) {
    console.error('Error in leadership conversation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
