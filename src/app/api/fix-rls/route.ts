import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // Temporarily disable RLS for testing
    const { error: disableError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE speaker_bookings DISABLE ROW LEVEL SECURITY;'
      });

    if (disableError) {
      console.error('Error disabling RLS:', disableError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error disabling RLS',
        debug: disableError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'RLS disabled for speaker_bookings table' 
    });

  } catch (error) {
    console.error('Error in fix-rls API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
