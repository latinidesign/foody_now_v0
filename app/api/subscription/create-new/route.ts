import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { getSubscriptionService } from "@/lib/services/subscription-service"

export const runtime = 'nodejs'

interface MercadoPagoPreApprovalResponse {
  id: string
  payer_id: number
  status: string
  init_point: string
  sandbox_init_point: string
  preapproval_plan_id: string
}

export async function POST(request: NextRequest) {
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

    // Verificar si ya tiene una suscripción activa
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending'])
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Ya tienes una suscripción activa o pendiente' },
        { status: 400 }
      )
    }

    // Configurar MercadoPago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Configuración de MercadoPago faltante' },
        { status: 500 }
      )
    }

    // Crear suscripción en MercadoPago
    const subscriptionData = {
      reason: process.env.SUBSCRIPTION_TITLE || 'Suscripción FoodyNow',
      external_reference: `user_${user.id}_${Date.now()}`,
      payer_email: user.email,
      auto_recurring: {
        frequency: 15,
        frequency_type: 'days',
        transaction_amount: parseFloat(process.env.SUBSCRIPTION_PRICE || '48900'),
        currency_id: 'ARS'
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/subscription/success`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`
    }

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('MercadoPago API Error:', errorData)
      return NextResponse.json(
        { error: 'Error creando suscripción en MercadoPago' },
        { status: 500 }
      )
    }

    const mercadoPagoData: MercadoPagoPreApprovalResponse = await response.json()

    // Guardar suscripción en la base de datos
    const { data: subscription, error: dbError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        mercadopago_preapproval_id: mercadoPagoData.id,
        status: 'pending',
        plan_id: 'premium',
        price: parseFloat(process.env.SUBSCRIPTION_PRICE || '48900'),
        currency: 'ARS'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database Error:', dbError)
      return NextResponse.json(
        { error: 'Error guardando suscripción' },
        { status: 500 }
      )
    }

    // Retornar URL de pago
    const checkoutUrl = process.env.NODE_ENV === 'production' 
      ? mercadoPagoData.init_point 
      : mercadoPagoData.sandbox_init_point

    return NextResponse.json({
      success: true,
      checkout_url: checkoutUrl,
      subscription_id: subscription.id,
      mercadopago_id: mercadoPagoData.id
    })

  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
