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

    const { consentGiven, consentVersion } = await request.json();

    if (typeof consentGiven !== 'boolean' || !consentVersion) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data' 
      }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Save consent
    const { error: consentError } = await supabase
      .from('consents')
      .insert({
        user_id: user.id,
        consent_version: consentVersion,
        consent_given: consentGiven
      });

    if (consentError) {
      return NextResponse.json({ 
        success: false, 
        error: consentError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Consent saved successfully' 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Get user ID from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check for existing consent
    const { data: consent, error: consentError } = await supabase
      .from('consents')
      .select('*')
      .eq('user_id', user.id)
      .eq('consent_given', true)
      .order('consent_date', { ascending: false })
      .limit(1)
      .single();

    if (consentError && consentError.code !== 'PGRST116') {
      return NextResponse.json({ 
        success: false, 
        error: consentError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      hasConsent: !!consent,
      consent: consent || null
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

