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

    // Create test data for the current month
    const testEntries = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Create entries for each day of the current month so far
    for (let day = 1; day <= today.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
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
      console.error('Error inserting monthly test data:', insertError);
      return NextResponse.json({ error: 'Failed to insert test data', details: insertError }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Monthly test data created successfully',
      insertedCount: insertedData?.length || 0,
      testEntries: testEntries.slice(0, 5) // Show first 5 entries as example
    });
  } catch (error) {
    console.error('Error in create-monthly-test-data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
