import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

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
    
    const supabase = createSupabaseServerClient();
    
    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .maybeSingle();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ success: false, message: 'Error fetching user data' }, { status: 500 });
    }

    if (!userData) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        id: userData.id,
        clerk_id: userData.clerk_id,
        firstname: userData.firstname,
        lastname: userData.lastname,
        name: userData.name,
        role: userData.role,
        team_id: userData.team_id,
        team_name: userData.team_name,
        personal_targets: userData.personal_targets
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Aktuelle User ID aus Clerk Auth holen
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    const body = await request.json();

    // Prüfen ob User bereits existiert
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .maybeSingle();

    let data, error;

    if (existingUser) {
      // User existiert - Update
      
      // 1. Team-ID basierend auf team_name finden oder erstellen (falls team_id noch null ist)
      let teamId = null;
      if (body.team_name) {
        // Erst versuchen, existierendes Team zu finden
        const { data: existingTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('name', body.team_name)
          .maybeSingle();
        
        if (existingTeam) {
          teamId = existingTeam.id;
        } else {
          // Team existiert nicht - erstellen
          const { data: newTeam, error: teamError } = await supabase
            .from('teams')
            .insert({
              name: body.team_name,
              description: `${body.team_name} Team`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (!teamError && newTeam) {
            teamId = newTeam.id;
          }
        }
      }
      
      // 2. User mit team_id updaten
      const result = await supabase
        .from('users')
        .update({
          firstname: body.firstName,
          lastname: body.lastName,
          name: body.name,
          role: body.role,
          team_name: body.team_name,
          team_id: teamId, // Automatisch zugewiesene team_id
          parent_leader_id: body.parent_leader_id || null,
          personal_targets: body.personal_targets || {}
        })
        .eq('clerk_id', userId)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // User existiert nicht - Create
      
      // 1. Team-ID basierend auf team_name finden oder erstellen
      let teamId = null;
      if (body.team_name) {
        // Erst versuchen, existierendes Team zu finden
        const { data: existingTeam } = await supabase
          .from('teams')
          .select('id')
          .eq('name', body.team_name)
          .maybeSingle();
        
        if (existingTeam) {
          teamId = existingTeam.id;
        } else {
          // Team existiert nicht - erstellen
          const { data: newTeam, error: teamError } = await supabase
            .from('teams')
            .insert({
              name: body.team_name,
              description: `${body.team_name} Team`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id')
            .single();
          
          if (!teamError && newTeam) {
            teamId = newTeam.id;
          }
        }
      }
      
      // 2. User mit team_id erstellen
      const result = await supabase
        .from('users')
        .insert({
          clerk_id: userId,
          email: body.email || '',
          firstname: body.firstName,
          lastname: body.lastName,
          name: body.name,
          role: body.role,
          team_name: body.team_name,
          team_id: teamId, // Automatisch zugewiesene team_id
          parent_leader_id: body.parent_leader_id || null,
          personal_targets: body.personal_targets || {},
          consent_given: true,
          consent_date: new Date().toISOString()
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ success: false, message: 'Error updating user data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}