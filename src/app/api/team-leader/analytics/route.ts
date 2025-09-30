import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    // Check if user is a team leader
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, team_id, is_team_leader')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || !user.is_team_leader) {
      return NextResponse.json({ error: 'Team leader access required' }, { status: 403 });
    }

    // Get team analytics using the database function
    const { data: analytics, error: analyticsError } = await supabase
      .rpc('get_team_analytics', { team_id_param: user.team_id });

    if (analyticsError) {
      console.error('Error fetching team analytics:', analyticsError);
      return NextResponse.json({ error: 'Database error fetching team analytics' }, { status: 500 });
    }

    return NextResponse.json(analytics[0] || null);
  } catch (error) {
    console.error('Error in GET /api/team-leader/analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
