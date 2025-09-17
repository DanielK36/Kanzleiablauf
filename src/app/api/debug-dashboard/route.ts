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

    const progress = {
      fa_current: totals.fa,
      fa_target: faTarget,
      eh_current: totals.eh,
      eh_target: ehTarget,
      new_appointments_current: totals.new_appointments,
      new_appointments_target: newAppointmentsTarget,
      recommendations_current: totals.recommendations,
      recommendations_target: recommendationsTarget,
      tiv_invitations_current: totals.tiv_invitations,
      tiv_invitations_target: tivInvitationsTarget,
      taa_invitations_current: totals.taa_invitations,
      taa_invitations_target: taaInvitationsTarget,
      tgs_registrations_current: totals.tgs_registrations,
      tgs_registrations_target: tgsRegistrationsTarget,
      bav_checks_current: totals.bav_checks,
      bav_checks_target: bavChecksTarget
    };

    return NextResponse.json({
      success: true,
      debug: {
        userId: user.id,
        personalTargets: personalTargets,
        monthlyEntriesCount: monthlyEntries?.length || 0,
        monthStart: monthStart.toISOString().split('T')[0],
        monthEnd: monthEnd.toISOString().split('T')[0]
      },
      progress: progress,
      // This is what the dashboard should receive
      dashboardData: {
        monthlyProgress: progress
      }
    });
  } catch (error) {
    console.error('Error in debug-dashboard:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
