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
    const { subscription, userId: clerkUserId } = await request.json();

    if (!subscription || !clerkUserId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscription and user ID are required' 
      }, { status: 400 });
    }

    // Store push subscription in database
    const { data: pushSubscription, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: clerkUserId,
        subscription: JSON.stringify(subscription),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing push subscription:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error storing subscription' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: pushSubscription 
    });

  } catch (error) {
    console.error('Error in push-subscribe API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Remove push subscription from database
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing push subscription:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Error removing subscription' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription removed successfully' 
    });

  } catch (error) {
    console.error('Error in push-subscribe DELETE API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
