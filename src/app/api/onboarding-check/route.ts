import { NextRequest, NextResponse } from 'next/server';
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
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user needs onboarding
    const today = new Date();
    const dayOfMonth = today.getDate();
    const isFirstTime = !user.personal_targets || Object.keys(user.personal_targets).length === 0;
    const isMonthEnd = dayOfMonth >= 28; // Show onboarding from 28th of month onwards

    const needsOnboarding = isFirstTime || isMonthEnd;

    return NextResponse.json({
      needsOnboarding,
      isFirstTime,
      isMonthEnd,
      user
    });
  } catch (error) {
    console.error('Error in GET /api/onboarding-check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
