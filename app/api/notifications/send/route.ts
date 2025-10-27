import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import webpush from 'web-push'

// Configure web-push only if keys are available
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY

let vapidConfigured = false

if (publicKey && privateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@foodynow.com.ar',
      publicKey,
      privateKey
    )
    vapidConfigured = true
  } catch (error) {
    console.warn('[Push Notifications] VAPID configuration failed:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { storeId, payload } = await request.json()

    if (!storeId || !payload) {
      return NextResponse.json(
        { error: 'Missing storeId or payload' },
        { status: 400 }
      )
    }

    // Check if VAPID is configured
    if (!vapidConfigured) {
      console.warn(`[API] VAPID not configured, skipping push notification for store ${storeId}`)
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 503 }
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
