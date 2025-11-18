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
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (dbError || !subscription) {
      return NextResponse.json({
        hasSubscription: false,
        status: null,
        trialDaysLeft: null,
        trialExpired: null
      })
    }

    // Calcular días restantes de trial si está en período de prueba
    let trialDaysLeft = null
    let trialExpired = false

    if (subscription.status === 'trial' && subscription.trial_end_date) {
      const now = new Date()
      const trialEnd = new Date(subscription.trial_end_date)
      const diffTime = trialEnd.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      trialDaysLeft = Math.max(0, diffDays)
      trialExpired = diffDays <= 0

      // Si el trial expiró, actualizar status
      if (trialExpired && subscription.status === 'trial') {
        await supabase
          .from('user_subscriptions')
          .update({ 
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)
        
        subscription.status = 'cancelled'
      }
    }

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.status,
      planId: subscription.plan_id,
      price: subscription.price,
      currency: subscription.currency,
      trialDaysLeft,
      trialExpired,
      trialStartDate: subscription.trial_start_date,
      trialEndDate: subscription.trial_end_date,
      subscriptionStartDate: subscription.subscription_start_date,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at
    })

  } catch (error) {
    console.error('Subscription status error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
