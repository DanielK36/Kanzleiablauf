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

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    // Create speaker_bookings table
    const { error: bookingsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS speaker_bookings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,
          event_date DATE NOT NULL,
          status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(event_id, event_date)
        );
        
        CREATE INDEX IF NOT EXISTS idx_speaker_bookings_event_id ON speaker_bookings(event_id);
        CREATE INDEX IF NOT EXISTS idx_speaker_bookings_speaker_id ON speaker_bookings(speaker_id);
        CREATE INDEX IF NOT EXISTS idx_speaker_bookings_event_date ON speaker_bookings(event_date);
        CREATE INDEX IF NOT EXISTS idx_speaker_bookings_status ON speaker_bookings(status);
        
        ALTER TABLE speaker_bookings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Speakers can view own bookings" ON speaker_bookings
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM speakers
              WHERE speakers.id = speaker_bookings.speaker_id
              AND speakers.email = auth.jwt() ->> 'sub'
            )
          );
        
        CREATE POLICY IF NOT EXISTS "Speakers can create own bookings" ON speaker_bookings
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM speakers
              WHERE speakers.id = speaker_bookings.speaker_id
              AND speakers.email = auth.jwt() ->> 'sub'
            )
          );
        
        CREATE POLICY IF NOT EXISTS "Speakers can update own bookings" ON speaker_bookings
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM speakers
              WHERE speakers.id = speaker_bookings.speaker_id
              AND speakers.email = auth.jwt() ->> 'sub'
            )
          );
        
        CREATE POLICY IF NOT EXISTS "Speakers can delete own bookings" ON speaker_bookings
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM speakers
              WHERE speakers.id = speaker_bookings.speaker_id
              AND speakers.email = auth.jwt() ->> 'sub'
            )
          );
        
        CREATE POLICY IF NOT EXISTS "Admins can view all bookings" ON speaker_bookings
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.clerk_id = auth.jwt() ->> 'sub'
              AND users.role = 'admin'
            )
          );
        
        CREATE POLICY IF NOT EXISTS "Admins can manage all bookings" ON speaker_bookings
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.clerk_id = auth.jwt() ->> 'sub'
              AND users.role = 'admin'
            )
          );
      `
    });

    if (bookingsError) {
      console.error('Error creating speaker_bookings table:', bookingsError);
    }

    // Create push_subscriptions table
    const { error: subscriptionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR(255) NOT NULL,
          subscription JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
        
        ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can manage own subscriptions" ON push_subscriptions
          FOR ALL USING (
            user_id = auth.jwt() ->> 'sub'
          );
        
        CREATE POLICY IF NOT EXISTS "Admins can view all subscriptions" ON push_subscriptions
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM users
              WHERE users.clerk_id = auth.jwt() ->> 'sub'
              AND users.role = 'admin'
            )
          );
      `
    });

    if (subscriptionsError) {
      console.error('Error creating push_subscriptions table:', subscriptionsError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tables created successfully' 
    });

  } catch (error) {
    console.error('Error in setup-tables API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
