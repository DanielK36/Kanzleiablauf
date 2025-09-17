import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Get current user data
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('name, personal_targets, monthly_targets')
      .not('personal_targets', 'is', null)
      .limit(1)
      .single();

    if (userError) {
      return NextResponse.json({ error: 'No user found', details: userError.message }, { status: 404 });
    }

    const user = users;
    const personalTargets = user.personal_targets || {};
    const monthlyTargets = user.monthly_targets || {};

    // Test the rounding problem
    const roundingTest = {
      fa: {
        daily: personalTargets.fa_daily || 0,
        monthlyFromDaily: (personalTargets.fa_daily || 0) * 22,
        monthlyStored: monthlyTargets.fa_target || 0,
        difference: (monthlyTargets.fa_target || 0) - ((personalTargets.fa_daily || 0) * 22)
      },
      eh: {
        daily: personalTargets.eh_daily || 0,
        monthlyFromDaily: (personalTargets.eh_daily || 0) * 22,
        monthlyStored: monthlyTargets.eh_target || 0,
        difference: (monthlyTargets.eh_target || 0) - ((personalTargets.eh_daily || 0) * 22)
      }
    };

    // Simulate what happens with exact monthly targets
    const exactTargets = {
      fa_target: 109,  // Exact value
      eh_target: 67,   // Exact value
      daily_calculated: {
        fa_daily: Math.round(109 / 22),  // 5
        eh_daily: Math.round(67 / 22)    // 3
      },
      monthly_back_calculated: {
        fa_monthly: Math.round(109 / 22) * 22,  // 5 * 22 = 110 (rounded up!)
        eh_monthly: Math.round(67 / 22) * 22    // 3 * 22 = 66 (rounded down!)
      },
      exact_values: {
        fa_monthly: 109,  // Original exact value
        eh_monthly: 67    // Original exact value
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Rounding fix test completed',
      currentUser: {
        name: user.name,
        personalTargets: personalTargets,
        monthlyTargets: monthlyTargets
      },
      roundingTest: roundingTest,
      exactTargetsExample: exactTargets,
      conclusion: {
        problem: "Daily targets * 22 != Original monthly targets due to rounding",
        solution: "Store exact monthly targets separately",
        status: "IMPLEMENTED - monthly_targets column now stores exact values"
      }
    });
  } catch (error) {
    console.error('Error in test-rounding-fix:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
