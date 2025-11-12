import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    // Obtener suscripción del usuario
    const { data: subscription, error: dbError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database Error:', dbError)
      return NextResponse.json(
        { error: 'Error obteniendo suscripción' },
        { status: 500 }
      )
    }

    // Si no tiene suscripción, verificar si está en trial
    if (!subscription) {
      // Verificar cuándo se creó la cuenta para calcular trial
      const trialDays = 15
      const accountCreated = new Date(user.created_at)
      const trialEnd = new Date(accountCreated.getTime() + (trialDays * 24 * 60 * 60 * 1000))
      const now = new Date()
      
      const isInTrial = now < trialEnd
      const trialDaysLeft = isInTrial ? Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : 0

      return NextResponse.json({
        hasSubscription: false,
        isInTrial,
        trialDaysLeft,
        trialEndDate: trialEnd.toISOString(),
        status: isInTrial ? 'trial' : 'expired'
      })
    }

    // Si tiene suscripción, obtener estado actual de MercadoPago
    let mercadoPagoStatus = subscription.status
    
    if (subscription.mercadopago_preapproval_id) {
      try {
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
        if (accessToken) {
          const response = await fetch(
            `https://api.mercadopago.com/preapproval/${subscription.mercadopago_preapproval_id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              }
            }
          )
          
          if (response.ok) {
            const mpData = await response.json()
            mercadoPagoStatus = mapMercadoPagoStatus(mpData.status)
            
            // Actualizar estado en la base de datos si cambió
            if (mercadoPagoStatus !== subscription.status) {
              await supabase
                .from('user_subscriptions')
                .update({ 
                  status: mercadoPagoStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('id', subscription.id)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching MercadoPago status:', error)
      }
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: mercadoPagoStatus,
        plan_id: subscription.plan_id,
        price: subscription.price,
        currency: subscription.currency,
        created_at: subscription.created_at,
        next_payment_date: subscription.next_payment_date,
        auto_renewal: subscription.auto_renewal
      }
    })

  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Mapear estados de MercadoPago a nuestros estados
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'authorized':
    case 'pending':
      return 'active'
    case 'paused':
      return 'suspended'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'pending'
  }
}
