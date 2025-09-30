import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Get all users who can be leaders (admin, führungskraft, or trainee)
    const { data: leaders, error } = await supabase
      .from('users')
      .select('id, firstname, lastname, name, team_name, role, is_team_leader')
      .in('role', ['admin', 'führungskraft', 'trainee'])
      .order('team_name', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching leaders:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    // Group leaders by team for better UX
    const leadersByTeam = leaders?.reduce((acc, leader) => {
      const teamName = leader.team_name || 'Kein Team';
      if (!acc[teamName]) {
        acc[teamName] = [];
      }
      acc[teamName].push(leader);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      data: leaders || [],
      groupedByTeam: leadersByTeam || {}
    });

  } catch (error) {
    console.error('Error in leaders API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
