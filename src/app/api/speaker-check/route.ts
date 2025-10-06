import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

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

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email, clerk_id')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      console.error('User not found:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if user is registered as speaker
    const { data: speaker, error: speakerError } = await supabase
      .from('speakers')
      .select('id, first_name, last_name, email, is_approved')
      .eq('email', user.email)
      .single();

    if (speakerError) {
      console.error('Speaker not found:', speakerError);
      return NextResponse.json({ 
        success: false, 
        error: 'Speaker not found. Please register as a speaker first.',
        user: user,
        speaker: null
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        user: user,
        speaker: speaker,
        isApproved: speaker.is_approved
      }
    });

  } catch (error) {
    console.error('Error in speaker-check API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
