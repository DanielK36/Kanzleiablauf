import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Setting up user:', { userId, body });

    const supabase = createSupabaseServerClient();

    // Create user with default values if not exists
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        clerk_id: userId,
        email: body.email || 'user@example.com',
        name: body.name || 'Test User',
        team_name: body.teamName || 'Test Team',
        role: body.role || 'advisor',
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
      .select()
      .single();

    console.log('User setup response:', { data: user, error });

    if (error) {
      console.error('Error setting up user:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      user: user,
      message: 'User setup completed'
    });
  } catch (error) {
    console.error('Error in setup-user:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
