import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    console.log('🔍 Admin check - userId:', userId, 'user:', user, 'error:', userError);

    if (userError || user?.role !== 'admin') {
      console.log('❌ Admin access denied - role:', user?.role);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all teams
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('team_level, name');

    if (error) {
      console.error('Error fetching teams:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: teams });
  } catch (error) {
    console.error('Error in GET /api/admin/teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = createSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, parent_team_id, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Determine team level
    let team_level = 1;
    if (parent_team_id) {
      const { data: parentTeam } = await supabase
        .from('teams')
        .select('team_level')
        .eq('id', parent_team_id)
        .single();
      
      if (parentTeam) {
        team_level = parentTeam.team_level + 1;
      }
    }

    // Create team
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({
        name,
        parent_team_id,
        team_level,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newTeam });
  } catch (error) {
    console.error('Error in POST /api/admin/teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = createSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, parent_team_id, description } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Team ID and name are required' }, { status: 400 });
    }

    // Determine team level
    let team_level = 1;
    if (parent_team_id) {
      const { data: parentTeam } = await supabase
        .from('teams')
        .select('team_level')
        .eq('id', parent_team_id)
        .single();
      
      if (parentTeam) {
        team_level = parentTeam.team_level + 1;
      }
    }

    // Update team
    const { data: updatedTeam, error } = await supabase
      .from('teams')
      .update({
        name,
        parent_team_id,
        team_level,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating team:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedTeam });
  } catch (error) {
    console.error('Error in PUT /api/admin/teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const supabase = createSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || user?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Delete team
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting team:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}