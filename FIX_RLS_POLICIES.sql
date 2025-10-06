-- Fix RLS Policies for speaker_bookings
-- The issue is that the policies check speakers.email = auth.jwt() ->> 'sub'
-- but auth.jwt() ->> 'sub' returns the Clerk user ID, not the email

-- Drop existing policies
DROP POLICY IF EXISTS "Speakers can view own bookings" ON speaker_bookings;
DROP POLICY IF EXISTS "Speakers can create own bookings" ON speaker_bookings;
DROP POLICY IF EXISTS "Speakers can update own bookings" ON speaker_bookings;
DROP POLICY IF EXISTS "Speakers can delete own bookings" ON speaker_bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON speaker_bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON speaker_bookings;

-- Create new policies that work with Clerk user ID
CREATE POLICY "Speakers can view own bookings" ON speaker_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM speakers
            JOIN users ON users.email = speakers.email
            WHERE speakers.id = speaker_bookings.speaker_id
            AND users.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Speakers can create own bookings" ON speaker_bookings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM speakers
            JOIN users ON users.email = speakers.email
            WHERE speakers.id = speaker_bookings.speaker_id
            AND users.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Speakers can update own bookings" ON speaker_bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM speakers
            JOIN users ON users.email = speakers.email
            WHERE speakers.id = speaker_bookings.speaker_id
            AND users.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Speakers can delete own bookings" ON speaker_bookings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM speakers
            JOIN users ON users.email = speakers.email
            WHERE speakers.id = speaker_bookings.speaker_id
            AND users.clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Admins can view all bookings" ON speaker_bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all bookings" ON speaker_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.clerk_id = auth.jwt() ->> 'sub'
            AND users.role = 'admin'
        )
    );
