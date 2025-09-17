import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();
    
    // Get user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create test data for the last 5 days
    const testEntries = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      testEntries.push({
        user_id: user.id,
        entry_date: dateStr,
        fa_count: Math.floor(Math.random() * 8) + 3, // 3-10
        eh_count: Math.floor(Math.random() * 5) + 2, // 2-6
        new_appointments: Math.floor(Math.random() * 6) + 1, // 1-6
        recommendations: Math.floor(Math.random() * 4) + 1, // 1-4
        tiv_invitations: Math.floor(Math.random() * 3) + 1, // 1-3
        taa_invitations: Math.floor(Math.random() * 2) + 1, // 1-2
        tgs_registrations: Math.floor(Math.random() * 2) + 1, // 1-2
        bav_checks: Math.floor(Math.random() * 4) + 1, // 1-4
        updated_at: new Date().toISOString()
      });
    }

    // Insert test data
    const { data: insertedData, error: insertError } = await supabase
      .from('daily_entries')
      .upsert(testEntries, { onConflict: 'user_id,entry_date' })
      .select();

    if (insertError) {
      console.error('Error inserting test data:', insertError);
      return NextResponse.json({ error: 'Failed to insert test data', details: insertError }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test data created successfully',
      insertedCount: insertedData?.length || 0,
      testEntries
    });
  } catch (error) {
    console.error('Error in create-test-data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
