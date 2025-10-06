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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || getCurrentMonth();

    // Get current user's goals for the month
    const { data: currentUser, error: userError2 } = await supabase
      .from('users')
      .select('id, name, personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (userError2 || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get existing monthly planning
    const { data: existingPlanning, error: planningError } = await supabase
      .from('monthly_planning')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('planning_month', `${month}-01`)
      .single();

    // Get previous month data for mirror
    const previousMonth = getPreviousMonth(month);
    const previousMonthMirror = await getPreviousMonthMirror(currentUser.id, previousMonth);

    // Get direct partners (users with same parent_leader_id)
    const { data: directPartners, error: partnersError } = await supabase
      .from('users')
      .select('id, name, team_name, personal_targets, parent_leader_id')
      .eq('parent_leader_id', currentUser.id);

    // Get FK goals for partners (from annual_goals where is_self_goal = false)
    const partnerIds = directPartners?.map(p => p.id) || [];
    const { data: fkGoals, error: fkGoalsError } = await supabase
      .from('annual_goals')
      .select('*')
      .in('user_id', partnerIds)
      .eq('is_self_goal', false);

    // Get current and previous month actuals for partners
    const partnersWithData = await Promise.all(
      (directPartners || []).map(async (partner) => {
        const [currentActual, previousActual] = await Promise.all([
          getMonthActuals(partner.id, month),
          getMonthActuals(partner.id, previousMonth)
        ]);

        const selfGoals = partner.personal_targets || {};
        const fkGoal = fkGoals?.find(g => g.user_id === partner.id);
        const fkGoalsData = fkGoal ? {
          fa_monthly_target: Math.round(fkGoal.fa_yearly_target / 12),
          eh_monthly_target: Math.round(fkGoal.eh_yearly_target / 12),
          new_appointments_monthly_target: Math.round(fkGoal.new_appointments_yearly_target / 12),
          recommendations_monthly_target: Math.round(fkGoal.recommendations_yearly_target / 12),
          tiv_invitations_monthly_target: Math.round(fkGoal.tiv_invitations_yearly_target / 12),
          taa_invitations_monthly_target: Math.round(fkGoal.taa_invitations_yearly_target / 12),
          tgs_registrations_monthly_target: Math.round(fkGoal.tgs_registrations_yearly_target / 12),
          bav_checks_monthly_target: Math.round(fkGoal.bav_checks_yearly_target / 12)
        } : {};

        const delta = selfGoals.fa_monthly_target > 0 
          ? Math.round(((fkGoalsData.fa_monthly_target - selfGoals.fa_monthly_target) / selfGoals.fa_monthly_target) * 100)
          : 0;

        const color = Math.abs(delta) >= 50 ? 'red' : Math.abs(delta) >= 25 ? 'yellow' : 'green';

        return {
          id: partner.id,
          name: partner.name,
          team_name: partner.team_name,
          selfGoals,
          fkGoals: fkGoalsData,
          previousMonthActual,
          currentMonthActual,
          delta,
          color,
          kpis: calculateKPIs(selfGoals, fkGoalsData),
          quotas: calculateQuotas(currentActual)
        };
      })
    );

    // Validation messages
    const validationMessages = [];
    if (previousMonthMirror.fa.percentage < 80) {
      validationMessages.push('Vormonat verfehlt - Begründung erforderlich');
    }
    if (existingPlanning && existingPlanning.fa_monthly_target > 0 && previousMonthMirror.fa.target > 0) {
      const increase = ((existingPlanning.fa_monthly_target - previousMonthMirror.fa.target) / previousMonthMirror.fa.target) * 100;
      if (increase > 25) {
        validationMessages.push('Ziel-Steigerung >25% - Potenziale-Begründung erforderlich');
      }
    }

    const response = {
      currentMonth: month,
      previousMonth,
      ownGoals: existingPlanning || {
        fa_monthly_target: 0,
        eh_monthly_target: 0,
        new_appointments_monthly_target: 0,
        recommendations_monthly_target: 0,
        tiv_invitations_monthly_target: 0,
        taa_invitations_monthly_target: 0,
        tgs_registrations_monthly_target: 0,
        bav_checks_monthly_target: 0
      },
      previousMonthMirror,
      directPartners: partnersWithData,
      validationMessages,
      focusAreas: ['Neukunden', 'Empfehlungen', 'TIV', 'TGS', 'bAV', 'Qualität/Prozess'],
      previousMonthMissedReason: existingPlanning?.previous_month_missed_reason || '',
      targetIncreaseReason: existingPlanning?.target_increase_reason || '',
      focusArea: existingPlanning?.focus_area || ''
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in GET /api/admin/monthly-planning:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { month, goals, previousMonthMissedReason, targetIncreaseReason, focusArea } = body;

    // Get current user
    const { data: currentUser, error: userError2 } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError2 || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert monthly planning
    const { data, error } = await supabase
      .from('monthly_planning')
      .upsert({
        user_id: currentUser.id,
        planning_month: `${month}-01`,
        fa_monthly_target: goals.fa_monthly_target || 0,
        eh_monthly_target: goals.eh_monthly_target || 0,
        new_appointments_monthly_target: goals.new_appointments_monthly_target || 0,
        recommendations_monthly_target: goals.recommendations_monthly_target || 0,
        tiv_invitations_monthly_target: goals.tiv_invitations_monthly_target || 0,
        taa_invitations_monthly_target: goals.taa_invitations_monthly_target || 0,
        tgs_registrations_monthly_target: goals.tgs_registrations_monthly_target || 0,
        bav_checks_monthly_target: goals.bav_checks_monthly_target || 0,
        previous_month_missed_reason: previousMonthMissedReason || null,
        target_increase_reason: targetIncreaseReason || null,
        focus_area: focusArea || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving monthly planning:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error in POST /api/admin/monthly-planning:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function getPreviousMonthMirror(userId: string, previousMonth: string) {
  const supabase = createSupabaseServerClient();
  
  // Get user's personal targets
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('personal_targets')
    .eq('id', userId)
    .single();

  if (userError || !user) return {};

  const personalTargets = user.personal_targets || {};
  
  // Get actual data for previous month
  const actuals = await getMonthActuals(userId, previousMonth);

  const metrics = ['fa', 'eh', 'new_appointments', 'recommendations', 'tiv_invitations', 'taa_invitations', 'tgs_registrations', 'bav_checks'];
  const mirror: any = {};

  metrics.forEach(metric => {
    const target = personalTargets[`${metric}_monthly_target`] || 0;
    const actual = actuals[metric] || 0;
    const percentage = target > 0 ? (actual / target) * 100 : 0;
    
    let color = 'green';
    if (percentage < 50) color = 'red';
    else if (percentage < 80) color = 'yellow';

    mirror[metric] = {
      target,
      actual,
      percentage,
      color
    };
  });

  return mirror;
}

async function getMonthActuals(userId: string, month: string) {
  const supabase = createSupabaseServerClient();
  
  const startDate = `${month}-01`;
  const endDate = `${month}-31`;
  
  const { data: entries, error } = await supabase
    .from('daily_entries')
    .select('fa, eh, new_appointments, recommendations, tiv_invitations, taa_invitations, tgs_registrations, bav_checks')
    .eq('user_id', userId)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);

  if (error || !entries) return {};

  // Sum up all entries for the month
  const totals = entries.reduce((acc, entry) => {
    Object.keys(entry).forEach(key => {
      if (typeof entry[key] === 'number') {
        acc[key] = (acc[key] || 0) + entry[key];
      }
    });
    return acc;
  }, {} as any);

  return totals;
}

function calculateKPIs(selfGoals: any, fkGoals: any) {
  const metrics = ['fa', 'eh', 'new_appointments', 'recommendations', 'tiv_invitations', 'taa_invitations', 'tgs_registrations', 'bav_checks'];
  const kpis: any = {};

  metrics.forEach(metric => {
    kpis[metric] = {
      self: selfGoals[`${metric}_monthly_target`] || 0,
      fk: fkGoals[`${metric}_monthly_target`] || 0
    };
  });

  return kpis;
}

function calculateQuotas(actuals: any) {
  return {
    appointments_per_fa: actuals.fa > 0 ? (actuals.new_appointments / actuals.fa).toFixed(2) : '0.00',
    recommendations_per_fa: actuals.fa > 0 ? (actuals.recommendations / actuals.fa).toFixed(2) : '0.00',
    tiv_per_fa: actuals.fa > 0 ? (actuals.tiv_invitations / actuals.fa).toFixed(2) : '0.00',
    tgs_per_tiv: actuals.tiv_invitations > 0 ? (actuals.tgs_registrations / actuals.tiv_invitations).toFixed(2) : '0.00',
    bav_per_fa: actuals.fa > 0 ? (actuals.bav_checks / actuals.fa).toFixed(2) : '0.00'
  };
}
