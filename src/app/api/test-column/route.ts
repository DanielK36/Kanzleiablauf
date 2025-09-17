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

    // Test if the column exists by trying to select it
    const { data, error } = await supabase
      .from('users')
      .select('clerk_id, name, personal_targets')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      return NextResponse.json({ 
        success: false,
        error: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'User found successfully',
      user: data,
      columnsAvailable: Object.keys(data || {})
    });
  } catch (error) {
    console.error('Error in test-column:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
