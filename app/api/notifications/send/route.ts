import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'

// Configure web-push with defaults for build time
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const privateKey = process.env.VAPID_PRIVATE_KEY || 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

webpush.setVapidDetails(
  'mailto:admin@foodynow.com.ar',
  publicKey,
  privateKey
)

export async function POST(request: NextRequest) {
  try {
    const { storeId, payload } = await request.json()

    if (!storeId || !payload) {
      return NextResponse.json(
        { error: 'Missing storeId or payload' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get push subscription for store
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')
      .eq('store_id', storeId)
      .single()

    if (error || !subscription) {
      console.warn(`[API] No push subscription found for store ${storeId}`)
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    // Send push notification
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key,
      },
    }

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 3600, // 1 hour
        urgency: 'high',
        vapidDetails: {
          subject: 'mailto:admin@foodynow.com.ar',
          publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
          privateKey: process.env.VAPID_PRIVATE_KEY || '',
        },
      }
    )

    console.log(`[API] Push notification sent to store ${storeId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to send push notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
