import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { storeId } = await request.json()

    if (!storeId) {
      return NextResponse.json(
        { error: 'Missing storeId' },
        { status: 400 }
      )
    }

    // Verificar configuración VAPID
    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY

    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({
        error: 'VAPID not configured',
        vapidPublic: !!vapidPublic,
        vapidPrivate: !!vapidPrivate
      }, { status: 500 })
    }

    const supabase = createAdminClient()

    // Verificar si existe suscripción para esta tienda
    const { data: subscription, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('store_id', storeId)
      .single()

    if (error) {
      return NextResponse.json({
        error: 'No subscription found',
        details: error.message,
        hasSubscription: false
      })
    }

    // Intentar enviar notificación de prueba
    const testPayload = {
      title: '🔔 Test de Notificación',
      body: `Prueba desde diagnóstico - ${new Date().toLocaleTimeString()}`,
      icon: '/icon-192.png',
      data: { test: true }
    }

    try {
      const sendResponse = await fetch(`${request.nextUrl.origin}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          payload: testPayload
        })
      })

      const sendResult = await sendResponse.json()

      return NextResponse.json({
        success: true,
        hasSubscription: true,
        subscription: {
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          created: subscription.created_at
        },
        testNotification: {
          sent: sendResponse.ok,
          result: sendResult
        }
      })

    } catch (sendError) {
      return NextResponse.json({
        success: false,
        hasSubscription: true,
        subscription: {
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          created: subscription.created_at
        },
        testNotification: {
          sent: false,
          error: sendError instanceof Error ? sendError.message : String(sendError)
        }
      })
    }

  } catch (error) {
    console.error('[Diagnosis] Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
