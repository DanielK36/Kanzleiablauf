import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

// Helper function to calculate team averages
async function calculateTeamAverages(supabase: any) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: entries } = await supabase
    .from('daily_entries')
    .select('*')
    .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0]);

  if (!entries || entries.length === 0) {
    return {
      fa: 0, eh: 0, new_appointments: 0, recommendations: 0,
      tiv_invitations: 0, taa_invitations: 0, tgs_registrations: 0, bav_checks: 0
    };
  }

  const totals = entries.reduce((acc, entry) => ({
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

  const dayCount = 30;
  return {
    fa: totals.fa / dayCount,
    eh: totals.eh / dayCount,
    new_appointments: totals.new_appointments / dayCount,
    recommendations: totals.recommendations / dayCount,
    tiv_invitations: totals.tiv_invitations / dayCount,
    taa_invitations: totals.taa_invitations / dayCount,
    tgs_registrations: totals.tgs_registrations / dayCount,
    bav_checks: totals.bav_checks / dayCount
  };
}

// Helper function to analyze quotas
function analyzeQuotas(quotas: any, teamAverages: any) {
  const analysis = [];
  
  Object.keys(quotas).forEach(metric => {
    const quota = quotas[metric];
    const teamAvg = teamAverages[metric] || 0;
    
    let status = 'good';
    let message = '';
    
    if (quota < 0.5) {
      status = 'critical';
      message = `${metric.toUpperCase()}: Kritisch niedrig (${(quota * 100).toFixed(1)}%)`;
    } else if (quota < 0.8) {
      status = 'warning';
      message = `${metric.toUpperCase()}: Verbesserungswürdig (${(quota * 100).toFixed(1)}%)`;
    } else if (quota > 1.2) {
      status = 'excellent';
      message = `${metric.toUpperCase()}: Hervorragend (${(quota * 100).toFixed(1)}%)`;
    } else {
      message = `${metric.toUpperCase()}: Im Zielbereich (${(quota * 100).toFixed(1)}%)`;
    }
    
    analysis.push({ metric, quota, teamAvg, status, message });
  });
  
  return analysis;
}

// Helper function to generate performance insights
function generatePerformanceInsights(teamAverages: any, quotaAnalysis: any) {
  const insights = [];
  
  // Overall performance insight
  const avgQuota = quotaAnalysis.reduce((sum: number, item: any) => sum + item.quota, 0) / quotaAnalysis.length;
  if (avgQuota > 1.1) {
    insights.push({
      type: 'success',
      title: 'Überdurchschnittliche Performance',
      description: `Das Team liegt mit ${(avgQuota * 100).toFixed(1)}% deutlich über dem Durchschnitt.`,
      recommendation: 'Diese Performance sollte als Benchmark für andere Teams dienen.'
    });
  } else if (avgQuota < 0.7) {
    insights.push({
      type: 'critical',
      title: 'Performance unter Erwartungen',
      description: `Das Team liegt mit ${(avgQuota * 100).toFixed(1)}% deutlich unter dem Durchschnitt.`,
      recommendation: 'Sofortige Maßnahmen und intensives Coaching erforderlich.'
    });
  }
  
  // Individual metric insights
  quotaAnalysis.forEach((item: any) => {
    if (item.status === 'critical') {
      insights.push({
        type: 'critical',
        title: `${item.metric.toUpperCase()} kritisch`,
        description: item.message,
        recommendation: 'Fokus auf Training und Unterstützung in diesem Bereich.'
      });
    } else if (item.status === 'excellent') {
      insights.push({
        type: 'success',
        title: `${item.metric.toUpperCase()} hervorragend`,
        description: item.message,
        recommendation: 'Erfolgsrezept analysieren und auf andere Bereiche übertragen.'
      });
    }
  });
  
  return insights;
}

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
      .select('id, name, email, team_name, role, personal_targets, created_at')
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

    // Calculate overall stats
    const overallStats = dailyEntries.reduce((acc, entry) => ({
      fa: acc.fa + (entry.fa_count || 0),
      eh: acc.eh + (entry.eh_count || 0),
      new_appointments: acc.new_appointments + (entry.new_appointments || 0),
      recommendations: acc.recommendations + (entry.recommendations || 0),
      tiv_invitations: acc.tiv_invitations + (entry.tiv_invitations || 0),
      taa_invitations: acc.taa_invitations + (entry.taa_invitations || 0),
      tgs_registrations: acc.tgs_registrations + (entry.tgs_registrations || 0),
      bav_checks: acc.bav_checks + (entry.bav_checks || 0),
      fa_target: acc.fa_target + (entry.fa_daily_target || 0),
      eh_target: acc.eh_target + (entry.eh_daily_target || 0),
      new_appointments_target: acc.new_appointments_target + (entry.new_appointments_daily_target || 0),
      recommendations_target: acc.recommendations_target + (entry.recommendations_daily_target || 0),
      tiv_invitations_target: acc.tiv_invitations_target + (entry.tiv_invitations_daily_target || 0),
      taa_invitations_target: acc.taa_invitations_target + (entry.taa_invitations_daily_target || 0),
      tgs_registrations_target: acc.tgs_registrations_target + (entry.tgs_registrations_daily_target || 0),
      bav_checks_target: acc.bav_checks_target + (entry.bav_checks_daily_target || 0)
    }), {
      fa: 0, eh: 0, new_appointments: 0, recommendations: 0,
      tiv_invitations: 0, taa_invitations: 0, tgs_registrations: 0, bav_checks: 0,
      fa_target: 0, eh_target: 0, new_appointments_target: 0, recommendations_target: 0,
      tiv_invitations_target: 0, taa_invitations_target: 0, tgs_registrations_target: 0, bav_checks_target: 0
    });

    // Calculate team performance
    const teamPerformance = teams.map(team => {
      const teamMembers = users.filter(user => user.team_name === team.name);
      const teamEntries = dailyEntries.filter(entry => 
        teamMembers.some(member => member.id === entry.user_id)
      );

      const teamTotals = teamEntries.reduce((acc, entry) => ({
        fa: acc.fa + (entry.fa_count || 0),
        eh: acc.eh + (entry.eh_count || 0),
        new_appointments: acc.new_appointments + (entry.new_appointments || 0),
        recommendations: acc.recommendations + (entry.recommendations || 0),
        tiv_invitations: acc.tiv_invitations + (entry.tiv_invitations || 0),
        taa_invitations: acc.taa_invitations + (entry.taa_invitations || 0),
        tgs_registrations: acc.tgs_registrations + (entry.tgs_registrations || 0),
        bav_checks: acc.bav_checks + (entry.bav_checks || 0),
        fa_target: acc.fa_target + (entry.fa_daily_target || 0),
        eh_target: acc.eh_target + (entry.eh_daily_target || 0),
        new_appointments_target: acc.new_appointments_target + (entry.new_appointments_daily_target || 0),
        recommendations_target: acc.recommendations_target + (entry.recommendations_daily_target || 0),
        tiv_invitations_target: acc.tiv_invitations_target + (entry.tiv_invitations_daily_target || 0),
        taa_invitations_target: acc.taa_invitations_target + (entry.taa_invitations_daily_target || 0),
        tgs_registrations_target: acc.tgs_registrations_target + (entry.tgs_registrations_daily_target || 0),
        bav_checks_target: acc.bav_checks_target + (entry.bav_checks_daily_target || 0)
      }), {
        fa: 0, eh: 0, new_appointments: 0, recommendations: 0,
        tiv_invitations: 0, taa_invitations: 0, tgs_registrations: 0, bav_checks: 0,
        fa_target: 0, eh_target: 0, new_appointments_target: 0, recommendations_target: 0,
        tiv_invitations_target: 0, taa_invitations_target: 0, tgs_registrations_target: 0, bav_checks_target: 0
      });

      // Calculate team performance percentage
      const metrics = ['fa', 'eh', 'new_appointments', 'recommendations', 'tiv_invitations', 'taa_invitations', 'tgs_registrations', 'bav_checks'];
      let totalProgress = 0;
      let metricCount = 0;

      metrics.forEach(metric => {
        const target = teamTotals[`${metric}_target`] || 0;
        const current = teamTotals[metric] || 0;
        if (target > 0) {
          totalProgress += (current / target) * 100;
          metricCount++;
        }
      });

      const performance = metricCount > 0 ? totalProgress / metricCount : 0;
      const leader = teamMembers.find(member => member.role === 'führungskraft')?.name || 'Kein Leader';

      return {
        name: team.name,
        leader,
        member_count: teamMembers.length,
        performance: Math.round(performance),
        trend: Math.round((Math.random() - 0.5) * 20) // Simulated trend
      };
    });

    // Calculate user activity
    const userActivity = users.map(user => {
      const userEntries = dailyEntries.filter(entry => entry.user_id === user.id);
      const activityScore = userEntries.length > 0 ? Math.min((userEntries.length / 7) * 100, 100) : 0;
      const lastEntry = userEntries[0];
      const lastActivity = lastEntry ? new Date(lastEntry.entry_date).toLocaleDateString('de-DE') : 'Nie';

      return {
        name: user.name,
        email: user.email,
        team: user.team_name,
        role: user.role,
        activity_score: Math.round(activityScore),
        last_activity: lastActivity
      };
    });

    // Generate trends (simulated for now)
    const trends = {
      fa: Math.round((Math.random() - 0.5) * 20),
      eh: Math.round((Math.random() - 0.5) * 20),
      new_appointments: Math.round((Math.random() - 0.5) * 20),
      recommendations: Math.round((Math.random() - 0.5) * 20),
      tiv_invitations: Math.round((Math.random() - 0.5) * 20),
      taa_invitations: Math.round((Math.random() - 0.5) * 20),
      tgs_registrations: Math.round((Math.random() - 0.5) * 20),
      bav_checks: Math.round((Math.random() - 0.5) * 20)
    };

    // Generate alerts
    const alerts = [];
    
    // Check for low performance teams
    teamPerformance.forEach(team => {
      if (team.performance < 50) {
        alerts.push({
          severity: 'critical',
          title: `Team ${team.name} unter 50% Performance`,
          description: `Aktuelle Performance: ${team.performance}% - Sofortige Maßnahmen erforderlich`,
          affected_users: [team.leader]
        });
      } else if (team.performance < 80) {
        alerts.push({
          severity: 'warning',
          title: `Team ${team.name} Performance verbesserungswürdig`,
          description: `Aktuelle Performance: ${team.performance}% - Coaching empfohlen`,
          affected_users: [team.leader]
        });
      }
    });

    // Check for inactive users
    userActivity.forEach(user => {
      if (user.activity_score < 30) {
        alerts.push({
          severity: 'warning',
          title: `Benutzer ${user.name} wenig aktiv`,
          description: `Aktivitäts-Score: ${user.activity_score}% - Letzte Aktivität: ${user.last_activity}`,
          affected_users: [user.name]
        });
      }
    });

    // Calculate team averages and quota analysis
    const teamAverages = await calculateTeamAverages(supabase);
    
    // Calculate overall quotas
    const overallQuotas = {
      fa: overallStats.fa_target > 0 ? overallStats.fa / overallStats.fa_target : 0,
      eh: overallStats.eh_target > 0 ? overallStats.eh / overallStats.eh_target : 0,
      new_appointments: overallStats.new_appointments_target > 0 ? overallStats.new_appointments / overallStats.new_appointments_target : 0,
      recommendations: overallStats.recommendations_target > 0 ? overallStats.recommendations / overallStats.recommendations_target : 0,
      tiv_invitations: overallStats.tiv_invitations_target > 0 ? overallStats.tiv_invitations / overallStats.tiv_invitations_target : 0,
      taa_invitations: overallStats.taa_invitations_target > 0 ? overallStats.taa_invitations / overallStats.taa_invitations_target : 0,
      tgs_registrations: overallStats.tgs_registrations_target > 0 ? overallStats.tgs_registrations / overallStats.tgs_registrations_target : 0,
      bav_checks: overallStats.bav_checks_target > 0 ? overallStats.bav_checks / overallStats.bav_checks_target : 0
    };

    const quotaAnalysis = analyzeQuotas(overallQuotas, teamAverages);
    const performanceInsights = generatePerformanceInsights(teamAverages, quotaAnalysis);

    const analyticsData = {
      overall_stats: overallStats,
      team_performance: teamPerformance,
      user_activity: userActivity,
      trends: trends,
      alerts: alerts,
      teamAverages: teamAverages,
      quotaAnalysis: quotaAnalysis,
      performanceInsights: performanceInsights
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Error in analytics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}