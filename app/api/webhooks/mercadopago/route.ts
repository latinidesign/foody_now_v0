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
    console.log(`📥 Webhook received: preapproval=${preapprovalId}, status=${mpData.status}`)
    
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

    // 🆕 MARCAR trial_used cuando la suscripción se autoriza por primera vez
    if (mpData.status === 'authorized') {
      // Obtener la suscripción para encontrar el store_id
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('store_id')
        .eq('mercadopago_preapproval_id', preapprovalId)
        .single()
      
      if (subscription) {
        // Marcar trial_used = true (solo si no estaba marcado)
        const { error } = await supabase
          .from('stores')
          .update({
            trial_used: true,
            trial_used_at: new Date().toISOString()
          })
          .eq('id', subscription.store_id)
          .eq('trial_used', false)  // Solo la primera vez
        
        if (!error) {
          console.log(`✅ Store ${subscription.store_id}: trial_used marked as true`)
        }
      }
    }

    console.log(`Subscription ${preapprovalId} updated to status: ${newStatus}`)
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

/**
 * Mapea estados de MercadoPago Preapproval a estados internos de FoodyNow
 * 
 * Estados MercadoPago:
 * - pending: Suscripción creada, esperando confirmación de pago
 * - authorized: Pago confirmado, suscripción activa
 * - paused: Pausada por usuario/merchant
 * - cancelled: Cancelada definitivamente
 * 
 * @see docs/ANALISIS-ESTADOS-SUSCRIPCION.md
 */
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'authorized':
      return 'active'     // ✅ Pago confirmado, suscripción activa
    case 'pending':
      return 'pending'    // 🔧 CORREGIDO: Esperando confirmación de pago
    case 'paused':
      return 'suspended'  // ✅ Pausada
    case 'cancelled':
      return 'cancelled'  // ✅ Cancelada
    default:
      return 'pending'    // Estado desconocido = pendiente
  }
}
