import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'edge'

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

    // Verificar si ya tiene una suscripción activa o en trial
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trial', 'pending'])
      .single()

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Ya tienes una suscripción activa, en período de prueba o pendiente' },
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

    // Usar plan existente de MercadoPago
    const planId = process.env.MERCADOPAGO_PLAN_ID
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan de suscripción no configurado' },
        { status: 500 }
      )
    }

    // Para testing, usar email de prueba si es entorno de desarrollo
    const isTestEnvironment = accessToken.startsWith('TEST-')
    const payerEmail = isTestEnvironment && process.env.MERCADOPAGO_TEST_USER_EMAIL 
      ? process.env.MERCADOPAGO_TEST_USER_EMAIL 
      : user.email

    const subscriptionData = {
      preapproval_plan_id: planId,
      external_reference: `user_${user.id}_${Date.now()}`,
      payer_email: payerEmail,
      back_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/settings`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`
    }

    // Usar endpoint correcto para suscripciones con plan
    const apiUrl = 'https://api.mercadopago.com/preapproval'

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `sub_${user.id}_${Date.now()}`
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

    // Calcular fechas de trial
    const trialStartDate = new Date()
    const trialEndDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 días

    // Guardar suscripción en la base de datos
    const { data: subscription, error: dbError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        mercadopago_preapproval_id: mercadoPagoData.id,
        status: 'trial',
        plan_id: 'premium',
        price: parseFloat(process.env.SUBSCRIPTION_PRICE || '36000'),
        currency: 'ARS',
        trial_start_date: trialStartDate.toISOString(),
        trial_end_date: trialEndDate.toISOString()
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

    // Retornar URL de pago (siempre usar init_point para suscripciones con plan)
    const checkoutUrl = mercadoPagoData.init_point

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
