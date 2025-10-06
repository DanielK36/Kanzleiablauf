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

    // Get current user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if user is already a speaker
    const { data: existingSpeaker, error: speakerCheckError } = await supabase
      .from('speakers')
      .select('id')
      .eq('email', user.email)
      .single();

    if (existingSpeaker) {
      return NextResponse.json({ 
        success: true, 
        message: 'User is already registered as a speaker',
        speaker: existingSpeaker
      });
    }

    // Create speaker entry
    const { data: newSpeaker, error: speakerError } = await supabase
      .from('speakers')
      .insert({
        first_name: user.name.split(' ')[0] || 'Unknown',
        last_name: user.name.split(' ').slice(1).join(' ') || 'User',
        email: user.email,
        bio: 'Auto-registered speaker',
        is_approved: true
      })
      .select()
      .single();

    if (speakerError) {
      console.error('Error creating speaker:', speakerError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error creating speaker',
        debug: speakerError.message
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Speaker registered successfully',
      speaker: newSpeaker
    });

  } catch (error) {
    console.error('Error in auto-register-speaker API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
