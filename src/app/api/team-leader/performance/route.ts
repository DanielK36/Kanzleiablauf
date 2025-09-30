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
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Check if user is a team leader
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, team_id, is_team_leader')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || !user.is_team_leader) {
      return NextResponse.json({ error: 'Team leader access required' }, { status: 403 });
    }

    // Calculate date range based on period
    let startDate: Date;
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'quarter':
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'month':
      default:
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    // Get team performance using the database function
    const { data: performance, error: performanceError } = await supabase
      .rpc('get_team_performance', { 
        team_id_param: user.team_id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

    if (performanceError) {
      console.error('Error fetching team performance:', performanceError);
      return NextResponse.json({ error: 'Database error fetching team performance' }, { status: 500 });
    }

    return NextResponse.json(performance || []);
  } catch (error) {
    console.error('Error in GET /api/team-leader/performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
