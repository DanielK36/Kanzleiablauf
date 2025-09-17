import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    // Get user's role and team info
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, role, team_name, parent_leader_id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let teamMembers = [];

    if (dbUser.role === 'top_leader') {
      // Top leader sees all sub-leaders and their advisors
      const { data: subLeaders, error: subLeadersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'sub_leader')
        .eq('parent_leader_id', dbUser.id);

      if (subLeadersError) {
        console.error('Error fetching sub-leaders:', subLeadersError);
      } else {
        teamMembers = subLeaders || [];
      }
    } else if (dbUser.role === 'sub_leader') {
      // Sub-leader sees their advisors
      const { data: advisors, error: advisorsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'advisor')
        .eq('parent_leader_id', dbUser.id);

      if (advisorsError) {
        console.error('Error fetching advisors:', advisorsError);
      } else {
        teamMembers = advisors || [];
      }
    }

    // Get recent daily entries for team members
    const teamMemberIds = teamMembers.map(member => member.id);
    let dailyEntries = [];

    if (teamMemberIds.length > 0) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: recentEntries, error: entriesError } = await supabase
        .from('daily_entries')
        .select('*')
        .in('user_id', teamMemberIds)
        .gte('entry_date', sevenDaysAgoStr)
        .order('entry_date', { ascending: false });

      if (entriesError) {
        console.error('Error fetching daily entries:', entriesError);
      } else {
        dailyEntries = recentEntries || [];
      }
    }

    return NextResponse.json({
      currentUser: dbUser,
      teamMembers,
      dailyEntries,
    });
  } catch (error) {
    console.error('Error in GET /api/team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
