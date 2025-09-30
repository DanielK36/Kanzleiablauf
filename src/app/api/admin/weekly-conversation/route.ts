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
        improvement_today: latestEntry?.improvement_today
      },
      conversation_points: conversationPoints,
      action_items: [],
      next_steps: []
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

