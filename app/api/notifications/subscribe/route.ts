import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { storeId, subscription } = await request.json()

    if (!storeId || !subscription) {
      return NextResponse.json(
        { error: 'Missing storeId or subscription' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Upsert push subscription for store
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        store_id: storeId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'store_id'
      })

    if (error) {
      console.error('[API] Failed to save push subscription:', error)
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Push subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
