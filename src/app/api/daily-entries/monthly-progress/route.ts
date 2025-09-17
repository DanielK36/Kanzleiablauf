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
    
    // Get user ID and targets from users table
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id, personal_targets, monthly_targets')
      .eq('clerk_id', userId)
      .single();

    // If user not found, create a default user
    if (userError || !user) {
      console.log('User not found in monthly-progress, creating default user:', userId);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .upsert({
          clerk_id: userId,
          email: 'user@example.com',
          name: 'Test User',
          team_name: 'Test Team',
          role: 'advisor',
          personal_targets: {
            fa_daily: 5,
            eh_daily: 3,
            new_appointments_daily: 3,
            recommendations_daily: 2,
            tiv_invitations_daily: 2,
            taa_invitations_daily: 1,
            tgs_registrations_daily: 1,
            bav_checks_daily: 2
          },
          consent_given: true,
          consent_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'clerk_id' })
        .select('id, personal_targets, monthly_targets')
        .single();

      if (createError || !newUser) {
        return NextResponse.json({ 
          error: 'Failed to create user', 
          details: createError?.message 
        }, { status: 500 });
      }
      
      user = newUser;
    }

    // Calculate current month's start and end dates
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all entries for current month
    const { data: entries, error: entriesError } = await supabase
      .from('daily_entries')
      .select('fa_count, eh_count, new_appointments, recommendations, tiv_invitations, taa_invitations, tgs_registrations, bav_checks')
      .eq('user_id', user.id)
      .gte('entry_date', monthStart.toISOString().split('T')[0])
      .lte('entry_date', monthEnd.toISOString().split('T')[0]);

    if (entriesError) {
      console.error('Error fetching monthly entries:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch monthly entries' }, { status: 500 });
    }

    // Calculate totals for all 8 metrics
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
      fa: 0, 
      eh: 0, 
      new_appointments: 0,
      recommendations: 0, 
      tiv_invitations: 0,
      taa_invitations: 0,
      tgs_registrations: 0,
      bav_checks: 0
    });

    // Get monthly targets (use original values, not converted from daily)
    const monthlyTargets = user.monthly_targets || {};
    const personalTargets = user.personal_targets || {};
    
    // Use monthly targets if available, otherwise calculate from daily targets
    const faTarget = monthlyTargets.fa_target || (personalTargets.fa_daily || 5) * 22;
    const ehTarget = monthlyTargets.eh_target || (personalTargets.eh_daily || 3) * 22;
    const newAppointmentsTarget = monthlyTargets.new_appointments_target || (personalTargets.new_appointments_daily || 3) * 22;
    const recommendationsTarget = monthlyTargets.recommendations_target || (personalTargets.recommendations_daily || 2) * 22;
    const tivInvitationsTarget = monthlyTargets.tiv_invitations_target || (personalTargets.tiv_invitations_daily || 1) * 22;
    const taaInvitationsTarget = monthlyTargets.taa_invitations_target || (personalTargets.taa_invitations_daily || 1) * 22;
    const tgsRegistrationsTarget = monthlyTargets.tgs_registrations_target || (personalTargets.tgs_registrations_daily || 1) * 22;
    const bavChecksTarget = monthlyTargets.bav_checks_target || (personalTargets.bav_checks_daily || 2) * 22;

    // Generate reminders
    const reminders = [];
    const daysInMonth = monthEnd.getDate();
    const daysLeft = monthEnd.getDate() - now.getDate();
    const workingDaysLeft = Math.max(1, daysLeft - Math.floor(daysLeft / 7) * 2); // Subtract weekends, minimum 1

    if (totals.fa < faTarget * 0.5 && workingDaysLeft > 0) {
      const faNeeded = Math.ceil((faTarget - totals.fa) / workingDaysLeft);
      reminders.push({
        type: 'danger',
        message: `Du brauchst noch ${faNeeded} FA pro Tag um dein Monatsziel zu erreichen!`
      });
    } else if (totals.fa < faTarget * 0.8) {
      reminders.push({
        type: 'warning',
        message: `Du hast noch ${faTarget - totals.fa} FA offen für dieses Monat.`
      });
    }

    if (totals.eh < ehTarget * 0.5 && workingDaysLeft > 0) {
      const ehNeeded = Math.ceil((ehTarget - totals.eh) / workingDaysLeft);
      reminders.push({
        type: 'danger',
        message: `Du brauchst noch ${ehNeeded} EH pro Tag um dein Monatsziel zu erreichen!`
      });
    }

    if (totals.recommendations === 0) {
      reminders.push({
        type: 'warning',
        message: 'Du hast noch keine Empfehlungen diesen Monat. Zeit für Empfehlungsimpulse!'
      });
    }

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
      bav_checks_target: bavChecksTarget,
      reminders
    };

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Error in GET /api/daily-entries/monthly-progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
