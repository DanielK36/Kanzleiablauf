import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

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

    // Get daily entries for the current week
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
      .eq('user_id', partnerId)
      .gte('entry_date', monday.toISOString().split('T')[0])
      .lte('entry_date', sunday.toISOString().split('T')[0])
      .order('entry_date', { ascending: false });

    if (entriesError) {
      console.error('Error fetching daily entries:', entriesError);
      return NextResponse.json({ error: 'Database error fetching entries' }, { status: 500 });
    }

    // Calculate current totals for the week
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
      fa_target: personalTargets.fa_weekly || 0,
      eh_target: personalTargets.eh_weekly || 0,
      new_appointments_target: personalTargets.new_appointments_weekly || 0,
      recommendations_target: personalTargets.recommendations_weekly || 0,
      tiv_invitations_target: personalTargets.tiv_invitations_weekly || 0,
      taa_invitations_target: personalTargets.taa_invitations_weekly || 0,
      tgs_registrations_target: personalTargets.tgs_registrations_weekly || 0,
      bav_checks_target: personalTargets.bav_checks_weekly || 0
    };

    // Calculate quotas
    const quotas = {
      appointments_per_fa: totals.fa > 0 ? totals.new_appointments / totals.fa : 0,
      recommendations_per_fa: totals.fa > 0 ? totals.recommendations / totals.fa : 0,
      tiv_per_fa: totals.fa > 0 ? totals.tiv_invitations / totals.fa : 0,
      tgs_per_tiv: totals.tiv_invitations > 0 ? totals.tgs_registrations / totals.tiv_invitations : 0,
      bav_per_fa: totals.fa > 0 ? totals.bav_checks / totals.fa : 0
    };

    // Get team averages for quota comparison
    const teamAverages = await getTeamAverages(partner.team_name);

    // Analyze quotas
    const quotaAnalysis = analyzeQuotas(quotas, teamAverages);

    // Generate conversation points based on performance
    const conversationPoints = [];
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

    // Generate conversation points
    if (strengths.length > 0) {
      conversationPoints.push(`💪 Stärken: ${strengths.join(', ')} - Wie können wir diese Stärken noch besser nutzen?`);
    }

    if (weaknesses.length > 0) {
      conversationPoints.push(`🎯 Verbesserungsbereiche: ${weaknesses.join(', ')} - Welche Unterstützung benötigst du?`);
    }

    // Check for patterns
    if (totals.fa > 0 && totals.recommendations === 0) {
      conversationPoints.push(`📈 Hohe FA-Zahlen, aber keine Empfehlungen - Wie können wir den Transfer verbessern?`);
    }

    if (totals.new_appointments > 0 && totals.tiv_invitations === 0) {
      conversationPoints.push(`📅 Viele Termine, aber keine TIV - Wie können wir die Qualität der Gespräche steigern?`);
    }

    if (dailyEntries.length === 0) {
      conversationPoints.push(`📝 Keine Tageseinträge diese Woche - Gibt es Hindernisse bei der Dateneingabe?`);
    }

    // Generate agenda snippets
    const agendaSnippets = generateAgendaSnippets(quotas, quotaAnalysis, totals);

    // Generate quota insights
    const quotaInsights = generateQuotaInsights(quotas, teamAverages, quotaAnalysis);

    // Get latest entry for highlights
    const latestEntry = dailyEntries[0];

    const conversationData = {
      partner: {
        id: partner.id,
        name: partner.name,
        team_name: partner.team_name,
        role: partner.role,
        weekly_progress: { ...totals, ...targets },
        daily_entries: dailyEntries,
        highlight_yesterday: latestEntry?.highlight_yesterday,
        help_needed: latestEntry?.help_needed,
        improvement_today: latestEntry?.improvement_today,
        quotas,
        teamAverages,
        quotaAnalysis
      },
      conversation_points: conversationPoints,
      action_items: [],
      next_steps: [],
      agenda_snippets: agendaSnippets,
      quota_insights: quotaInsights
    };

    return NextResponse.json(conversationData);

  } catch (error) {
    console.error('Error in weekly conversation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, notes, actionItems, nextSteps } = body;

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Save conversation data
    const { error } = await supabase
      .from('conversations')
      .insert({
        partner_id: partnerId,
        notes: notes,
        action_items: actionItems,
        next_steps: nextSteps,
        conversation_date: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving conversation:', error);
      return NextResponse.json({ error: 'Database error saving conversation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in weekly conversation POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
async function getTeamAverages(teamName: string) {
  const supabase = createSupabaseServerClient();
  
  // Get team members
  const { data: teamMembers, error: membersError } = await supabase
    .from('users')
    .select('id')
    .eq('team_name', teamName);

  if (membersError || !teamMembers) return {};

  const memberIds = teamMembers.map(m => m.id);
  
  // Get last 30 days of data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: entries, error: entriesError } = await supabase
    .from('daily_entries')
    .select('fa, new_appointments, recommendations, tiv_invitations, tgs_registrations, bav_checks')
    .in('user_id', memberIds)
    .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0]);

  if (entriesError || !entries) return {};

  // Calculate averages
  const totals = entries.reduce((acc, entry) => {
    Object.keys(entry).forEach(key => {
      if (typeof entry[key] === 'number') {
        acc[key] = (acc[key] || 0) + entry[key];
      }
    });
    return acc;
  }, {} as any);

  const count = entries.length;
  
  return {
    appointments_per_fa: totals.fa > 0 ? totals.new_appointments / totals.fa : 0,
    recommendations_per_fa: totals.fa > 0 ? totals.recommendations / totals.fa : 0,
    tiv_per_fa: totals.fa > 0 ? totals.tiv_invitations / totals.fa : 0,
    tgs_per_tiv: totals.tiv_invitations > 0 ? totals.tgs_registrations / totals.tiv_invitations : 0,
    bav_per_fa: totals.fa > 0 ? totals.bav_checks / totals.fa : 0
  };
}

function analyzeQuotas(quotas: any, teamAverages: any) {
  const analysis: any = {};
  
  Object.keys(quotas).forEach(quota => {
    const own = quotas[quota];
    const team = teamAverages[quota] || 0;
    const delta = team > 0 ? ((own - team) / team) * 100 : 0;
    
    let status = 'good';
    let message = 'Quota entspricht dem Team-Durchschnitt';
    
    if (delta < -20) {
      status = 'critical';
      message = 'Quota deutlich unter Team-Durchschnitt - Unterstützung erforderlich';
    } else if (delta < -10) {
      status = 'warning';
      message = 'Quota leicht unter Team-Durchschnitt - Verbesserungspotenzial';
    } else if (delta > 20) {
      status = 'excellent';
      message = 'Quota deutlich über Team-Durchschnitt - Best Practice teilen';
    } else if (delta > 10) {
      status = 'good';
      message = 'Quota über Team-Durchschnitt - gute Performance';
    }
    
    analysis[quota] = { status, message };
  });
  
  return analysis;
}

function generateAgendaSnippets(quotas: any, quotaAnalysis: any, totals: any) {
  const snippets = [];
  
  // Based on quota performance
  if (quotaAnalysis.appointments_per_fa?.status === 'critical') {
    snippets.push('📅 Termine pro FA optimieren - Qualität vs. Quantität besprechen');
  }
  
  if (quotaAnalysis.recommendations_per_fa?.status === 'critical') {
    snippets.push('⭐ Empfehlungsgespräche verstärken - Transfer-Techniken üben');
  }
  
  if (quotaAnalysis.tiv_per_fa?.status === 'critical') {
    snippets.push('🤝 TIV-Quote verbessern - Netzwerkaufbau strategisch angehen');
  }
  
  if (quotaAnalysis.tgs_per_tiv?.status === 'critical') {
    snippets.push('📋 TGS-Conversion steigern - Follow-up-Prozesse optimieren');
  }
  
  if (quotaAnalysis.bav_per_fa?.status === 'critical') {
    snippets.push('🏦 bAV-Checks erhöhen - Qualitätsanker stärken');
  }
  
  // Based on absolute numbers
  if (totals.fa > 0 && totals.recommendations === 0) {
    snippets.push('📈 FA-Erfolg nicht in Empfehlungen umgesetzt - Transfer-Strategie entwickeln');
  }
  
  if (totals.new_appointments > 0 && totals.tiv_invitations === 0) {
    snippets.push('📅 Termine führen nicht zu TIV - Gesprächsqualität verbessern');
  }
  
  return snippets;
}

function generateQuotaInsights(quotas: any, teamAverages: any, quotaAnalysis: any) {
  const insights = [];
  
  Object.keys(quotas).forEach(quota => {
    const own = quotas[quota];
    const team = teamAverages[quota] || 0;
    const analysis = quotaAnalysis[quota];
    
    if (analysis.status === 'critical') {
      insights.push(`🔴 ${quota.replace('_', '/').toUpperCase()}: ${own.toFixed(2)} vs. Team ${team.toFixed(2)} - Sofortige Maßnahmen erforderlich`);
    } else if (analysis.status === 'warning') {
      insights.push(`🟡 ${quota.replace('_', '/').toUpperCase()}: ${own.toFixed(2)} vs. Team ${team.toFixed(2)} - Verbesserungspotenzial identifiziert`);
    } else if (analysis.status === 'excellent') {
      insights.push(`🟢 ${quota.replace('_', '/').toUpperCase()}: ${own.toFixed(2)} vs. Team ${team.toFixed(2)} - Best Practice für Team`);
    }
  });
  
  return insights;
}

