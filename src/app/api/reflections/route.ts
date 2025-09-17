import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reflection_text, mood_score, energy_level, focus_areas, action_items } = body;

    const supabase = createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('leadership_reflections')
      .insert({
        user_id: userId,
        reflection_text,
        mood_score,
        energy_level,
        focus_areas,
        action_items,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reflection:', error);
      return NextResponse.json({ error: 'Failed to create reflection' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/reflections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('leadership_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reflections:', error);
      return NextResponse.json({ error: 'Failed to fetch reflections' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/reflections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
