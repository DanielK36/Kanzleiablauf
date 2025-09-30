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

    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, firstname, lastname, name, email, team_name, role, team_id, parent_leader_id, is_team_leader')
      .order('team_name, name');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
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
    
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        name: body.name,
        email: body.email,
        team_name: body.team_name,
        role: body.role,
        is_team_leader: body.is_team_leader || false,
        parent_leader_id: body.parent_leader_id || null,
        personal_targets: body.personal_targets || {}
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newUser });
  } catch (error) {
    console.error('Error in POST /api/admin/users:', error);
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
    const { id, name, email, team_name, role, is_team_leader, parent_leader_id, personal_targets } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        name,
        email,
        team_name,
        role,
        is_team_leader: is_team_leader || false,
        parent_leader_id: parent_leader_id || null,
        personal_targets: personal_targets || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error in PUT /api/admin/users:', error);
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

    const { searchParams } = new URL(request.url);
    const userIdToDelete = searchParams.get('id');
    
    if (!userIdToDelete) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userIdToDelete);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
