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
    const { searchParams } = new URL(request.url);
    const approved = searchParams.get('approved') === 'true';

    let query = supabase
      .from('speakers')
      .select('*')
      .order('created_at', { ascending: false });

    if (approved) {
      query = query.eq('is_approved', true);
    }

    const { data: speakers, error } = await query;

    if (error) {
      console.error('Error fetching speakers:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: speakers || [] 
    });

  } catch (error) {
    console.error('Error in speakers API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

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

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, firstname, lastname, email')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    const speakerData = await request.json();

    // Check if speaker already exists
    const { data: existingSpeaker } = await supabase
      .from('speakers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSpeaker) {
      return NextResponse.json({ 
        success: false, 
        error: 'Speaker profile already exists' 
      }, { status: 400 });
    }

    const { data: newSpeaker, error } = await supabase
      .from('speakers')
      .insert({
        user_id: user.id,
        first_name: user.firstname || speakerData.first_name,
        last_name: user.lastname || speakerData.last_name,
        email: user.email || speakerData.email,
        ...speakerData,
        is_approved: false // Admin muss freigeben
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating speaker:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: newSpeaker 
    });

  } catch (error) {
    console.error('Error in speakers POST API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    const { id, ...updateData } = await request.json();

    const { data: updatedSpeaker, error } = await supabase
      .from('speakers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating speaker:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedSpeaker 
    });

  } catch (error) {
    console.error('Error in speakers PUT API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
