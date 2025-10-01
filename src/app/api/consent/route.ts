import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    console.log('🔍 Consent POST - userId:', userId);
    
    if (!userId) {
      console.log('❌ Consent POST - No userId');
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const { consentGiven, consentVersion } = await request.json();
    console.log('🔍 Consent POST - Data:', { consentGiven, consentVersion });

    if (typeof consentGiven !== 'boolean' || !consentVersion) {
      console.log('❌ Consent POST - Invalid data');
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

    console.log('🔍 Consent POST - User lookup:', { user, userError });

    if (userError || !user) {
      console.log('❌ Consent POST - User not found, creating temporary consent with clerk_id');
      
      // For new users who haven't completed onboarding yet, save consent with clerk_id
      const { error: consentError } = await supabase
        .from('consents')
        .insert({
          clerk_id: userId, // Use clerk_id directly for new users
          consent_version: consentVersion,
          consent_given: consentGiven
        });

      console.log('🔍 Consent POST - Temporary save result:', { consentError });

      if (consentError) {
        console.log('❌ Consent POST - Temporary save failed:', consentError);
        return NextResponse.json({ 
          success: false, 
          error: consentError.message 
        }, { status: 500 });
      }

      console.log('✅ Consent POST - Temporary consent saved successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Temporary consent saved successfully' 
      });
    }

    // Save consent
    const { error: consentError } = await supabase
      .from('consents')
      .insert({
        user_id: user.id,
        clerk_id: userId, // Also save clerk_id for consistency
        consent_version: consentVersion,
        consent_given: consentGiven
      });

    console.log('🔍 Consent POST - Save result:', { consentError });

    if (consentError) {
      console.log('❌ Consent POST - Save failed:', consentError);
      return NextResponse.json({ 
        success: false, 
        error: consentError.message 
      }, { status: 500 });
    }

    console.log('✅ Consent POST - Success');
    return NextResponse.json({ 
      success: true, 
      message: 'Consent saved successfully' 
    });

  } catch (error) {
    console.log('❌ Consent POST - Exception:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    console.log('🔍 Consent GET - userId:', userId);
    
    if (!userId) {
      console.log('❌ Consent GET - No userId');
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

    console.log('🔍 Consent GET - User lookup:', { user, userError });

    let consent;
    let consentError;

    if (userError || !user) {
      console.log('❌ Consent GET - User not found, checking temporary consent with clerk_id');
      
      // For new users who haven't completed onboarding yet, check consent with clerk_id
      const { data: tempConsent, error: tempConsentError } = await supabase
        .from('consents')
        .select('*')
        .eq('clerk_id', userId)
        .eq('consent_given', true)
        .order('consent_date', { ascending: false })
        .limit(1)
        .single();

      consent = tempConsent;
      consentError = tempConsentError;
    } else {
      // Check for existing consent with user_id
      const { data: userConsent, error: userConsentError } = await supabase
        .from('consents')
        .select('*')
        .eq('user_id', user.id)
        .eq('consent_given', true)
        .order('consent_date', { ascending: false })
        .limit(1)
        .single();

      consent = userConsent;
      consentError = userConsentError;
    }

    console.log('🔍 Consent GET - Consent lookup:', { consent, consentError });

    if (consentError && consentError.code !== 'PGRST116') {
      console.log('❌ Consent GET - Consent lookup failed:', consentError);
      return NextResponse.json({ 
        success: false, 
        error: consentError.message 
      }, { status: 500 });
    }

    console.log('✅ Consent GET - Success, hasConsent:', !!consent);
    return NextResponse.json({ 
      success: true, 
      hasConsent: !!consent,
      consent: consent || null
    });

  } catch (error) {
    console.log('❌ Consent GET - Exception:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

