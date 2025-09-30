import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { todayFocus } = body;

    // Validate required fields
    if (!todayFocus) {
      return NextResponse.json({ error: 'Missing todayFocus data' }, { status: 400 });
    }

    // TODO: Save to database (team_focus table or similar)
    // For now, just return success
    console.log('🚀 Team Focus saved:', todayFocus);

    return NextResponse.json({
      success: true,
      message: 'Team focus saved successfully',
      todayFocus
    });

  } catch (error) {
    console.error('Error saving team focus:', error);
    return NextResponse.json({ error: 'Failed to save team focus' }, { status: 500 });
  }
}
