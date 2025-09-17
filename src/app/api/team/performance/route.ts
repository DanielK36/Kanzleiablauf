import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    // Get user ID and role from users table
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, team_name')
      .eq('clerk_id', userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate current week's start and end dates (Monday to Friday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 1, Sunday = 0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // Friday

    // Get team members based on user role
    let teamMembers: any[] = [];
    
    if (currentUser.role === 'top_leader') {
      // Get all advisors and sub_leaders
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, name, role, team_name')
        .in('role', ['advisor', 'sub_leader'])
        .eq('team_name', currentUser.team_name);
      
      if (membersError) {
        console.error('Error fetching team members:', membersError);
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
      }
      
      teamMembers = members || [];
    } else if (currentUser.role === 'sub_leader') {
      // Get advisors under this sub_leader
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, name, role, team_name')
        .eq('role', 'advisor')
        .eq('parent_leader_id', currentUser.id);
      
      if (membersError) {
        console.error('Error fetching team members:', membersError);
        return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
      }
      
      teamMembers = members || [];
    }

    // Get performance data for each team member
    const membersWithPerformance = await Promise.all(
      teamMembers.map(async (member) => {
        const { data: entries, error: entriesError } = await supabase
          .from('daily_entries')
          .select('fa_count, eh_count, new_appointments, recommendations, entry_date')
          .eq('user_id', member.id)
          .gte('entry_date', weekStart.toISOString().split('T')[0])
          .lte('entry_date', weekEnd.toISOString().split('T')[0]);

        if (entriesError) {
          console.error(`Error fetching entries for ${member.name}:`, entriesError);
          return {
            ...member,
            fa_count: 0,
            eh_count: 0,
            appointments: 0,
            recommendations: 0,
            days_active: 0,
            performance_percentage: 0
          };
        }

        // Calculate totals
        const totals = entries.reduce((acc, entry) => ({
          fa_count: acc.fa_count + (entry.fa_count || 0),
          eh_count: acc.eh_count + (entry.eh_count || 0),
          appointments: acc.appointments + (entry.new_appointments || 0),
          recommendations: acc.recommendations + (entry.recommendations || 0)
        }), { fa_count: 0, eh_count: 0, appointments: 0, recommendations: 0 });

        // Calculate performance percentage (simple calculation)
        const daysActive = entries.length;
        const performancePercentage = Math.min(
          ((totals.fa_count / 25) * 0.4 + (totals.eh_count / 15) * 0.4 + (totals.recommendations / 8) * 0.2) * 100,
          100
        );

        return {
          ...member,
          ...totals,
          days_active: daysActive,
          performance_percentage: Math.round(performancePercentage)
        };
      })
    );

    // Calculate team totals
    const teamStats = membersWithPerformance.reduce((acc, member) => ({
      totalFA: acc.totalFA + member.fa_count,
      totalEH: acc.totalEH + member.eh_count,
      totalAppointments: acc.totalAppointments + member.appointments,
      totalRecommendations: acc.totalRecommendations + member.recommendations
    }), { totalFA: 0, totalEH: 0, totalAppointments: 0, totalRecommendations: 0 });

    return NextResponse.json({
      success: true,
      members: membersWithPerformance,
      stats: teamStats
    });
  } catch (error) {
    console.error('Error in GET /api/team/performance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
