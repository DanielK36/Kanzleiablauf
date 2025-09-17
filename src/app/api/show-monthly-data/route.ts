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
    
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate current month's start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get entries for current month
    const { data: monthlyEntries, error: monthlyEntriesError } = await supabase
      .from('daily_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', monthStart.toISOString().split('T')[0])
      .lte('entry_date', monthEnd.toISOString().split('T')[0]);

    // Calculate totals for all 8 metrics
    const totals = monthlyEntries?.reduce((acc, entry) => ({
      fa: acc.fa + (entry.fa_count || 0),
      eh: acc.eh + (entry.eh_count || 0),
      new_appointments: acc.new_appointments + (entry.new_appointments || 0),
      recommendations: acc.recommendations + (entry.recommendations || 0),
      tiv_invitations: acc.tiv_invitations + (entry.tiv_invitations || 0),
      taa_invitations: acc.taa_invitations + (entry.taa_invitations || 0),
      tgs_registrations: acc.tgs_registrations + (entry.tgs_registrations || 0),
      bav_checks: acc.bav_checks + (entry.bav_checks || 0)
    }), { 
      fa: 0, 
      eh: 0, 
      new_appointments: 0,
      recommendations: 0, 
      tiv_invitations: 0,
      taa_invitations: 0,
      tgs_registrations: 0,
      bav_checks: 0
    }) || { 
      fa: 0, eh: 0, new_appointments: 0, recommendations: 0, 
      tiv_invitations: 0, taa_invitations: 0, tgs_registrations: 0, bav_checks: 0 
    };

    // Get personal targets
    const personalTargets = user.personal_targets || {};
    const faTarget = (personalTargets.fa_daily || 5) * 22;
    const ehTarget = (personalTargets.eh_daily || 3) * 22;
    const newAppointmentsTarget = (personalTargets.new_appointments_daily || 3) * 22;
    const recommendationsTarget = (personalTargets.recommendations_daily || 2) * 22;
    const tivInvitationsTarget = (personalTargets.tiv_invitations_daily || 1) * 22;
    const taaInvitationsTarget = (personalTargets.taa_invitations_daily || 1) * 22;
    const tgsRegistrationsTarget = (personalTargets.tgs_registrations_daily || 1) * 22;
    const bavChecksTarget = (personalTargets.bav_checks_daily || 2) * 22;

    return NextResponse.json({
      success: true,
      summary: {
        monthStart: monthStart.toISOString().split('T')[0],
        monthEnd: monthEnd.toISOString().split('T')[0],
        entriesCount: monthlyEntries?.length || 0,
        workingDaysSoFar: Math.floor((now.getDate() - 1) / 7) * 5 + Math.min(5, (now.getDate() - 1) % 7)
      },
      currentValues: {
        fa: totals.fa,
        eh: totals.eh,
        new_appointments: totals.new_appointments,
        recommendations: totals.recommendations,
        tiv_invitations: totals.tiv_invitations,
        taa_invitations: totals.taa_invitations,
        tgs_registrations: totals.tgs_registrations,
        bav_checks: totals.bav_checks
      },
      monthlyTargets: {
        fa: faTarget,
        eh: ehTarget,
        new_appointments: newAppointmentsTarget,
        recommendations: recommendationsTarget,
        tiv_invitations: tivInvitationsTarget,
        taa_invitations: taaInvitationsTarget,
        tgs_registrations: tgsRegistrationsTarget,
        bav_checks: bavChecksTarget
      },
      dailyTargets: personalTargets,
      progress: {
        fa: Math.round((totals.fa / faTarget) * 100),
        eh: Math.round((totals.eh / ehTarget) * 100),
        new_appointments: Math.round((totals.new_appointments / newAppointmentsTarget) * 100),
        recommendations: Math.round((totals.recommendations / recommendationsTarget) * 100),
        tiv_invitations: Math.round((totals.tiv_invitations / tivInvitationsTarget) * 100),
        taa_invitations: Math.round((totals.taa_invitations / taaInvitationsTarget) * 100),
        tgs_registrations: Math.round((totals.tgs_registrations / tgsRegistrationsTarget) * 100),
        bav_checks: Math.round((totals.bav_checks / bavChecksTarget) * 100)
      },
      recentEntries: monthlyEntries?.slice(0, 3) || []
    });
  } catch (error) {
    console.error('Error in show-monthly-data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
