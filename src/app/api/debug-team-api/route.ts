import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    // Simple test - just get Daniel's user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, role, parent_leader_id')
      .eq('name', 'Daniel')
      .single();

    return NextResponse.json({
      success: true,
      user,
      userError: userError?.message || null,
      message: 'Simple debug test'
    });
  } catch (error) {
    console.error('Error in debug-team-api:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
