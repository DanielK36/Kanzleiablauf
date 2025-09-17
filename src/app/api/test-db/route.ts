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

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError.message,
        code: testError.code,
        hint: testError.hint
      });
    }

    // Test user lookup
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      user: user,
      userError: userError,
      testData: testData
    });
  } catch (error) {
    console.error('Error in test-db:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
