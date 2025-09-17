import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple test without authentication
    const today = new Date();
    const dayOfMonth = today.getDate();
    const needsUpdate = dayOfMonth >= 28;

    return NextResponse.json({ 
      success: true, 
      needsMonthlyGoalUpdate: needsUpdate,
      currentDay: dayOfMonth,
      message: 'Test API working'
    });
  } catch (error) {
    console.error('Error in test-monthly-goals:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
