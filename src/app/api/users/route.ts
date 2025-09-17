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
    const { firstName, lastName, name, team_name, role, parent_leader_id, personal_targets, monthly_targets } = body;

    console.log('Received onboarding data:', body); // Debug log

    const supabase = createSupabaseServerClient();

    // Upsert user data with proper conflict resolution
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        clerk_id: userId,
        email: body.email || 'user@example.com',
        name: name || `${firstName || ''} ${lastName || ''}`.trim(),
        team_name,
        role,
        parent_leader_id,
        personal_targets: personal_targets || {
          fa_daily: 5,
          eh_daily: 3,
          new_appointments_daily: 3,
          recommendations_daily: 2,
          tiv_invitations_daily: 2,
          taa_invitations_daily: 1,
          tgs_registrations_daily: 1,
          bav_checks_daily: 2
        },
        monthly_targets: monthly_targets || {
          fa_target: 110,
          eh_target: 66,
          new_appointments_target: 66,
          recommendations_target: 44,
          tiv_invitations_target: 22,
          taa_invitations_target: 22,
          tgs_registrations_target: 22,
          bav_checks_target: 44
        },
        consent_given: true,
        consent_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'clerk_id' })
      .select()
      .single();

    console.log('Supabase response:', { data: user, error }); // Debug log

    if (error) {
      console.error('Error creating/updating user:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
