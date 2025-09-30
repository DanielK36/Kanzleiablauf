import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
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
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient permissions' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { user_id, parent_leader_id, is_team_leader } = body;

    if (!user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id is required' 
      }, { status: 400 });
    }

    // Update user hierarchy
    const updateData: any = {
      parent_leader_id: parent_leader_id || null,
      is_team_leader: is_team_leader || false,
    };

    // If user is being set as team leader, also update role to führungskraft
    if (is_team_leader) {
      updateData.role = 'führungskraft';
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user hierarchy:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Hierarchie erfolgreich aktualisiert'
    });

  } catch (error: any) {
    console.error('Error in update-hierarchy API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
