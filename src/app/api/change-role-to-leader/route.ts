import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createSupabaseServerClient();

    // Change your role from advisor to sub_leader so you can access kanzleiablauf
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'sub_leader',
        updated_at: new Date().toISOString()
      })
      .eq('name', 'Daniel') // Change based on your name
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update role', 
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Role changed to sub_leader successfully',
      user: updatedUser,
      instructions: {
        step1: 'Refresh your browser (F5)',
        step2: 'Go to: http://localhost:3000/kanzleiablauf',
        step3: 'You should now see the Kanzleiablauf page with real data!'
      }
    });
  } catch (error) {
    console.error('Error in change-role-to-leader:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
