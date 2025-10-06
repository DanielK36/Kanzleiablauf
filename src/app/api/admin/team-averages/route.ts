import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = createSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all teams
    const { data: teams, error: teamsError } = await supabase
      .from('users')
      .select('team_name')
      .not('team_name', 'is', null)
      .neq('team_name', '');

    if (teamsError) {
      console.error('Error loading teams:', teamsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const uniqueTeams = [...new Set(teams?.map(t => t.team_name) || [])];
    const teamAverages = [];

    for (const teamName of uniqueTeams) {
      // Get team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('users')
        .select('id, name')
        .eq('team_name', teamName);

      if (membersError) continue;

      const memberIds = teamMembers?.map(m => m.id) || [];
      if (memberIds.length === 0) continue;

      // Calculate date ranges
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Get daily entries for 30 days
      const { data: entries30, error: error30 } = await supabase
        .from('daily_entries')
        .select('*')
        .in('user_id', memberIds)
        .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])
        .lte('entry_date', now.toISOString().split('T')[0]);

      // Get daily entries for 90 days
      const { data: entries90, error: error90 } = await supabase
        .from('daily_entries')
        .select('*')
        .in('user_id', memberIds)
        .gte('entry_date', ninetyDaysAgo.toISOString().split('T')[0])
        .lte('entry_date', now.toISOString().split('T')[0]);

      if (error30 || error90) continue;

      // Calculate averages
      const metrics = [
        'fa', 'eh', 'new_appointments', 'recommendations', 
        'tiv_invitations', 'taa_invitations', 'tgs_registrations', 'bav_checks'
      ];

      const teamData = {
        team_name: teamName,
        metrics: {} as any,
        quotas: {} as any
      };

      // Calculate metric averages
      metrics.forEach(metric => {
        const values30 = entries30?.map(e => e[metric] || 0) || [];
        const values90 = entries90?.map(e => e[metric] || 0) || [];

        teamData.metrics[metric] = {
          avg_30: values30.length > 0 ? values30.reduce((a, b) => a + b, 0) / values30.length : 0,
          avg_90: values90.length > 0 ? values90.reduce((a, b) => a + b, 0) / values90.length : 0,
          count: values30.length
        };
      });

      // Calculate quota averages
      const quotas = [
        { name: 'appointments_per_fa', numerator: 'new_appointments', denominator: 'fa' },
        { name: 'recommendations_per_fa', numerator: 'recommendations', denominator: 'fa' },
        { name: 'tiv_per_fa', numerator: 'tiv_invitations', denominator: 'fa' },
        { name: 'tgs_per_tiv', numerator: 'tgs_registrations', denominator: 'tiv_invitations' },
        { name: 'bav_per_fa', numerator: 'bav_checks', denominator: 'fa' }
      ];

      quotas.forEach(quota => {
        const values30 = entries30?.map(e => {
          const num = e[quota.numerator] || 0;
          const den = e[quota.denominator] || 0;
          return den > 0 ? num / den : 0;
        }) || [];
        
        const values90 = entries90?.map(e => {
          const num = e[quota.numerator] || 0;
          const den = e[quota.denominator] || 0;
          return den > 0 ? num / den : 0;
        }) || [];

        teamData.quotas[quota.name] = {
          avg_30: values30.length > 0 ? values30.reduce((a, b) => a + b, 0) / values30.length : 0,
          avg_90: values90.length > 0 ? values90.reduce((a, b) => a + b, 0) / values90.length : 0
        };
      });

      teamAverages.push(teamData);
    }

    return NextResponse.json({
      success: true,
      data: teamAverages
    });

  } catch (error) {
    console.error('Error in GET /api/admin/team-averages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
