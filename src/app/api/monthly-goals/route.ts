import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    // Aktuelle User ID aus Clerk Auth holen
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    // Fetch user's monthly goals from personal_targets
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('personal_targets')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ success: false, message: 'Error fetching user data' }, { status: 500 });
    }

    if (!userData) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const personalTargets = userData.personal_targets || {};
    
    return NextResponse.json({ 
      success: true, 
      data: {
        currentGoals: {
          fa_monthly: personalTargets.fa_monthly_target || 0,
          eh_monthly: personalTargets.eh_monthly_target || 0,
          new_appointments_monthly: personalTargets.new_appointments_monthly_target || 0,
          recommendations_monthly: personalTargets.recommendations_monthly_target || 0,
          tiv_invitations_monthly: personalTargets.tiv_invitations_monthly_target || 0,
          bav_checks_monthly: personalTargets.bav_checks_monthly_target || 0,
          taa_invitations_monthly: personalTargets.taa_invitations_monthly_target || 0,
          tgs_registrations_monthly: personalTargets.tgs_registrations_monthly_target || 0,
        }
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/monthly-goals:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fallbackUserId = 'user_323Fmf0gM8mLKTuHGu1rSjDy6gm';

    // Update personal_targets with monthly goals
    const { data, error } = await supabase
      .from('users')
      .update({
        personal_targets: {
          fa_monthly_target: body.fa_monthly || 0,
          eh_monthly_target: body.eh_monthly || 0,
          new_appointments_monthly_target: body.new_appointments_monthly || 0,
          recommendations_monthly_target: body.recommendations_monthly || 0,
          tiv_invitations_monthly_target: body.tiv_invitations_monthly || 0,
          bav_checks_monthly_target: body.bav_checks_monthly || 0,
          taa_invitations_monthly_target: body.taa_invitations_monthly || 0,
          tgs_registrations_monthly_target: body.tgs_registrations_monthly || 0,
        }
      })
      .eq('clerk_id', fallbackUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating monthly goals:', error);
      return NextResponse.json({ success: false, message: 'Error updating monthly goals' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in POST /api/monthly-goals:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}