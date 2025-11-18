import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('MercadoPago webhook received:', body)

    // Verificar el webhook (opcional pero recomendado en producción)
    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get('x-signature')
      // Aquí podrías verificar la firma del webhook
    }

    // Procesar diferentes tipos de notificaciones
    if (body.type === 'subscription_preapproval') {
      await handleSubscriptionUpdate(body.data.id)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(preapprovalId: string) {
  try {
    const supabase = await createClient()
    
    // Obtener información actualizada de MercadoPago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) return

    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${preapprovalId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    )

    if (!response.ok) return

    const mpData = await response.json()
    const newStatus = mapMercadoPagoStatus(mpData.status)

    // Preparar datos de actualización
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Si cambió de trial a active, marcar cuando comenzó la suscripción paga
    if (newStatus === 'active') {
      updateData.subscription_start_date = new Date().toISOString()
    }

    // Actualizar estado en la base de datos
    await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('mercadopago_preapproval_id', preapprovalId)

    console.log(`Subscription ${preapprovalId} updated to status: ${newStatus}`)
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'authorized':
      return 'active'  // Trial terminado y primer pago procesado
    case 'pending':
      return 'trial'   // En período de prueba
    case 'paused':
      return 'suspended'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'pending'
  }
}
