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
    const cycle = searchParams.get('cycle') || 'bis 30.12.2025';

    // Get cycle dates
    const cycleData = getCycleData(cycle);
    if (!cycleData) {
      return NextResponse.json({ error: 'Invalid cycle' }, { status: 400 });
    }

    // Get current user
    const { data: currentUser, error: userError2 } = await supabase
      .from('users')
      .select('id, name, personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (userError2 || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get IST-Basis (sum from cycle start to October 1st)
    const istBasis = await getIstBasis(currentUser.id, cycleData.start, cycleData.istCutoff);

    // Get existing annual goals
    const { data: selfGoals, error: selfGoalsError } = await supabase
      .from('annual_goals')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('cycle_start', cycleData.start)
      .eq('is_self_goal', true)
      .single();

    const { data: fkGoals, error: fkGoalsError } = await supabase
      .from('annual_goals')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('cycle_start', cycleData.start)
      .eq('is_self_goal', false)
      .single();

    // Generate plan months (remaining months from November to cycle end)
    const planMonths = generatePlanMonths(cycleData.start, cycleData.end);

    // Consistency check
    const consistencyCheck = checkConsistency(
      selfGoals || {},
      fkGoals || {},
      istBasis,
      planMonths
    );

    // Get team overview
    const teamOverview = await getTeamOverview(currentUser.id, cycleData.start);

    // Check if plan is locked
    const { data: lockData, error: lockError } = await supabase
      .from('annual_goals')
      .select('locked_until')
      .eq('user_id', currentUser.id)
      .eq('cycle_start', cycleData.start)
      .eq('is_self_goal', true)
      .single();

    const isLocked = lockData?.locked_until && new Date(lockData.locked_until) > new Date();
    const lockExpiry = lockData?.locked_until || null;

    const response = {
      currentCycle: {
        start: cycleData.start,
        end: cycleData.end,
        label: cycle
      },
      istBasis: {
        ...istBasis,
        is_editable: !isLocked && new Date() <= new Date(cycleData.istCutoff)
      },
      selfGoals: selfGoals || {
        fa_yearly_target: 0,
        eh_yearly_target: 0,
        new_appointments_yearly_target: 0,
        recommendations_yearly_target: 0,
        tiv_invitations_yearly_target: 0,
        taa_invitations_yearly_target: 0,
        tgs_registrations_yearly_target: 0,
        bav_checks_yearly_target: 0
      },
      fkGoals: fkGoals || {
        fa_yearly_target: 0,
        eh_yearly_target: 0,
        new_appointments_yearly_target: 0,
        recommendations_yearly_target: 0,
        tiv_invitations_yearly_target: 0,
        taa_invitations_yearly_target: 0,
        tgs_registrations_yearly_target: 0,
        bav_checks_yearly_target: 0,
        fk_comment: ''
      },
      planMonths,
      consistencyCheck,
      teamOverview,
      isLocked,
      lockExpiry
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error in GET /api/admin/annual-goals:', error);
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
    const { cycle, step, istBasis, selfGoals, fkGoals, planMonths } = body;

    // Get current user
    const { data: currentUser, error: userError2 } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError2 || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cycleData = getCycleData(cycle);
    if (!cycleData) {
      return NextResponse.json({ error: 'Invalid cycle' }, { status: 400 });
    }

    // Save based on step
    switch (step) {
      case 1:
        // Save IST-Basis
        await saveIstBasis(currentUser.id, cycleData.start, istBasis);
        break;
      
      case 2:
        // Save Self and FK goals
        await saveAnnualGoals(currentUser.id, cycleData.start, selfGoals, true);
        await saveAnnualGoals(currentUser.id, cycleData.start, fkGoals, false);
        break;
      
      case 3:
        // Save plan months
        await savePlanMonths(currentUser.id, cycleData.start, planMonths);
        break;
      
      case 4:
        // Finalize and lock
        await finalizePlan(currentUser.id, cycleData.start);
        break;
    }

    return NextResponse.json({
      success: true,
      message: `Step ${step} saved successfully`
    });

  } catch (error) {
    console.error('Error in POST /api/admin/annual-goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function getCycleData(cycle: string) {
  const cycles = [
    { start: '2025-01-01', end: '2025-12-31', label: 'bis 30.12.2025', istCutoff: '2025-10-01' },
    { start: '2025-07-01', end: '2026-06-30', label: 'bis 30.06.2026', istCutoff: '2026-04-01' }
  ];
  
  return cycles.find(c => c.label === cycle);
}

async function getIstBasis(userId: string, cycleStart: string, istCutoff: string) {
  const supabase = createSupabaseServerClient();
  
  const { data: entries, error } = await supabase
    .from('daily_entries')
    .select('fa, eh, new_appointments, recommendations, tiv_invitations, taa_invitations, tgs_registrations, bav_checks')
    .eq('user_id', userId)
    .gte('entry_date', cycleStart)
    .lte('entry_date', istCutoff);

  if (error || !entries) return {};

  // Sum up all entries
  const totals = entries.reduce((acc, entry) => {
    Object.keys(entry).forEach(key => {
      if (typeof entry[key] === 'number') {
        acc[`${key}_actual`] = (acc[`${key}_actual`] || 0) + entry[key];
      }
    });
    return acc;
  }, {} as any);

  return totals;
}

function generatePlanMonths(cycleStart: string, cycleEnd: string) {
  const startDate = new Date(cycleStart);
  const endDate = new Date(cycleEnd);
  const planStart = new Date(startDate.getFullYear(), 10, 1); // November 1st
  
  const months = [];
  const current = new Date(planStart);
  
  while (current <= endDate) {
    months.push({
      month: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
      monthName: current.toLocaleDateString('de-DE', { year: 'numeric', month: 'long' }),
      fa_plan: 0,
      eh_plan: 0,
      new_appointments_plan: 0,
      recommendations_plan: 0,
      tiv_invitations_plan: 0,
      taa_invitations_plan: 0,
      tgs_registrations_plan: 0,
      bav_checks_plan: 0
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
}

function checkConsistency(selfGoals: any, fkGoals: any, istBasis: any, planMonths: any[]) {
  const metrics = ['fa', 'eh', 'new_appointments', 'recommendations', 'tiv_invitations', 'taa_invitations', 'tgs_registrations', 'bav_checks'];
  const deviations = [];
  
  metrics.forEach(metric => {
    const self = selfGoals[`${metric}_yearly_target`] || 0;
    const fk = fkGoals[`${metric}_yearly_target`] || 0;
    const delta = self > 0 ? Math.abs(fk - self) / self * 100 : 0;
    
    if (delta >= 25) {
      deviations.push({
        metric: metric.toUpperCase(),
        self,
        fk,
        delta: Math.round(delta),
        color: delta >= 50 ? 'red' : 'yellow'
      });
    }
  });
  
  return {
    isConsistent: deviations.length === 0,
    tolerance: 2, // Admin configurable
    deviations
  };
}

async function getTeamOverview(currentUserId: string, cycleStart: string) {
  const supabase = createSupabaseServerClient();
  
  // Get direct partners
  const { data: partners, error: partnersError } = await supabase
    .from('users')
    .select('id, name, team_name')
    .eq('parent_leader_id', currentUserId);

  if (partnersError || !partners) return [];

  const teamOverview = await Promise.all(
    partners.map(async (partner) => {
      // Get goals
      const [selfGoals, fkGoals] = await Promise.all([
        supabase.from('annual_goals').select('*').eq('user_id', partner.id).eq('cycle_start', cycleStart).eq('is_self_goal', true).single(),
        supabase.from('annual_goals').select('*').eq('user_id', partner.id).eq('cycle_start', cycleStart).eq('is_self_goal', false).single()
      ]);

      // Get IST data
      const istBasis = await getIstBasis(partner.id, cycleStart, '2025-10-01');
      const istCurrent = await getIstBasis(partner.id, cycleStart, new Date().toISOString().split('T')[0]);

      // Calculate path expectation
      const pathExpectation = calculatePathExpectation(istBasis, selfGoals.data);

      const self = selfGoals.data?.fa_yearly_target || 0;
      const fk = fkGoals.data?.fa_yearly_target || 0;
      const delta = self > 0 ? ((fk - self) / self) * 100 : 0;
      const color = Math.abs(delta) >= 50 ? 'red' : Math.abs(delta) >= 25 ? 'yellow' : 'green';
      const onTrack = istCurrent.fa_actual >= pathExpectation.fa_expected * 0.9;

      return {
        id: partner.id,
        name: partner.name,
        team_name: partner.team_name,
        selfGoals: selfGoals.data || {},
        fkGoals: fkGoals.data || {},
        istBasis,
        istCurrent,
        pathExpectation,
        onTrack,
        color,
        delta: Math.round(delta)
      };
    })
  );

  return teamOverview;
}

function calculatePathExpectation(istBasis: any, goals: any) {
  const metrics = ['fa', 'eh', 'new_appointments', 'recommendations', 'tiv_invitations', 'taa_invitations', 'tgs_registrations', 'bav_checks'];
  const expectation: any = {};
  
  metrics.forEach(metric => {
    const target = goals?.[`${metric}_yearly_target`] || 0;
    const actual = istBasis[`${metric}_actual`] || 0;
    const monthsPassed = 9; // January to September
    const totalMonths = 12;
    const expected = (target / totalMonths) * monthsPassed;
    
    expectation[`${metric}_expected`] = Math.round(expected);
  });
  
  return expectation;
}

async function saveIstBasis(userId: string, cycleStart: string, istBasis: any) {
  const supabase = createSupabaseServerClient();
  
  // This would typically update a separate IST-Basis table
  // For now, we'll store it in annual_goals as metadata
  await supabase
    .from('annual_goals')
    .upsert({
      user_id: userId,
      cycle_start: cycleStart,
      is_self_goal: true,
      ist_basis_data: istBasis,
      updated_at: new Date().toISOString()
    });
}

async function saveAnnualGoals(userId: string, cycleStart: string, goals: any, isSelfGoal: boolean) {
  const supabase = createSupabaseServerClient();
  
  await supabase
    .from('annual_goals')
    .upsert({
      user_id: userId,
      cycle_start: cycleStart,
      is_self_goal: isSelfGoal,
      fa_yearly_target: goals.fa_yearly_target || 0,
      eh_yearly_target: goals.eh_yearly_target || 0,
      new_appointments_yearly_target: goals.new_appointments_yearly_target || 0,
      recommendations_yearly_target: goals.recommendations_yearly_target || 0,
      tiv_invitations_yearly_target: goals.tiv_invitations_yearly_target || 0,
      taa_invitations_yearly_target: goals.taa_invitations_yearly_target || 0,
      tgs_registrations_yearly_target: goals.tgs_registrations_yearly_target || 0,
      bav_checks_yearly_target: goals.bav_checks_yearly_target || 0,
      fk_comment: goals.fk_comment || null,
      updated_at: new Date().toISOString()
    });
}

async function savePlanMonths(userId: string, cycleStart: string, planMonths: any[]) {
  const supabase = createSupabaseServerClient();
  
  await supabase
    .from('annual_goals')
    .upsert({
      user_id: userId,
      cycle_start: cycleStart,
      is_self_goal: true,
      plan_months_data: planMonths,
      updated_at: new Date().toISOString()
    });
}

async function finalizePlan(userId: string, cycleStart: string) {
  const supabase = createSupabaseServerClient();
  
  const lockUntil = new Date();
  lockUntil.setDate(lockUntil.getDate() + 7); // 7 days lock
  
  await supabase
    .from('annual_goals')
    .upsert({
      user_id: userId,
      cycle_start: cycleStart,
      is_self_goal: true,
      locked_until: lockUntil.toISOString(),
      finalized_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
}
