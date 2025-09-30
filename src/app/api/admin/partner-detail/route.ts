import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const timeframe = searchParams.get('timeframe') || 'weekly';

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Get partner details
    const { data: partner, error: partnerError } = await supabase
      .from('users')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (partnerError) {
      console.error('Error fetching partner:', partnerError);
      return NextResponse.json({ error: 'Database error fetching partner' }, { status: 500 });
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
      .eq('user_id', partnerId)
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .lte('entry_date', endDate.toISOString().split('T')[0])
      .order('entry_date', { ascending: false });

    if (entriesError) {
      console.error('Error fetching daily entries:', entriesError);
      return NextResponse.json({ error: 'Database error fetching entries' }, { status: 500 });
    }

    // Calculate current totals for the period
    const totals = dailyEntries.reduce((acc, entry) => ({
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
    const personalTargets = partner.personal_targets || {};
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
    const latestEntry = dailyEntries[0];

    // Generate insights
    const insights = [];
    const progress = { ...totals, ...targets };

    // Check for strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    const metrics = ['fa', 'eh', 'new_appointments', 'recommendations', 'tiv_invitations', 'taa_invitations', 'tgs_registrations', 'bav_checks'];
    
    metrics.forEach(metric => {
      const target = targets[`${metric}_target`] || 0;
      const current = totals[metric] || 0;
      const progressPercent = target > 0 ? (current / target) * 100 : 0;
      
      if (progressPercent >= 100) {
        strengths.push(metric.toUpperCase());
      } else if (progressPercent < 50) {
        weaknesses.push(metric.toUpperCase());
      }
    });

    // Generate insights based on patterns
    if (strengths.length > 0) {
      insights.push({
        type: 'strength',
        title: `💪 Stärke als Vorbild nutzen`,
        description: `Stark in: ${strengths.join(', ')}`,
        action: `Setze ihn als Mentor für andere Partner ein`,
        priority: 'medium'
      });
    }

    if (weaknesses.length > 0) {
      insights.push({
        type: 'focus',
        title: `🎯 Fokus setzen`,
        description: `Schwäche in: ${weaknesses.join(', ')}`,
        action: `Coaching-Gespräch: ${weaknesses[0]} trainieren`,
        priority: 'high'
      });
    }

    // Check for risk patterns
    const hasHighNumbers = totals.fa > 0 || totals.eh > 0 || totals.new_appointments > 0;
    const hasLowSoftSkills = totals.recommendations === 0 && totals.tiv_invitations === 0;
    
    if (hasHighNumbers && hasLowSoftSkills) {
      insights.push({
        type: 'risk',
        title: `⚠️ Burnout-Risiko`,
        description: `Hohe Zahlen, aber keine Empfehlungen/TIV → Gefahr der Stagnation`,
        action: `Fokus auf Transfer-Training und Energie-Management`,
        priority: 'high'
      });
    }

    const partnerData = {
      partner: {
        id: partner.id,
        name: partner.name,
        team_name: partner.team_name,
        role: partner.role,
        personal_targets: personalTargets,
        weekly_progress: { ...totals, ...targets },
        monthly_progress: { ...totals, ...targets },
        daily_entries: dailyEntries,
        highlight_yesterday: latestEntry?.highlight_yesterday,
        help_needed: latestEntry?.help_needed,
        improvement_today: latestEntry?.improvement_today
      },
      performance_history: [], // TODO: Implement historical data
      team_comparison: {}, // TODO: Implement team comparison
      insights: insights
    };

    return NextResponse.json(partnerData);

  } catch (error) {
    console.error('Error in partner detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}