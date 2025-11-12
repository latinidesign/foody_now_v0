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

    // Verificar si ya tiene una suscripción activa
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
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
      reason: process.env.SUBSCRIPTION_TITLE || 'Plan Premium FoodyNow',
      external_reference: `user_${user.id}_${Date.now()}`,
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
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
      .from('subscriptions')
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
      .select("id, name, user_id")
      .eq("id", storeId)
      .eq("user_id", user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Tienda no encontrada o no autorizada" },
        { status: 404 }
      )
    }

    // Obtener información del plan
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Plan no encontrado" },
        { status: 404 }
      )
    }

    // Si es plan de prueba, crear suscripción directamente
    if (plan.is_trial) {
      // Verificar si ya tiene una suscripción
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("store_id", storeId)
        .single()

      if (existingSubscription) {
        return NextResponse.json(
          { error: "La tienda ya tiene una suscripción activa" },
          { status: 400 }
        )
      }

      // Crear suscripción de prueba
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + plan.duration_days)

      const { data: subscription, error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          store_id: storeId,
          plan_id: planId,
          status: "trial",
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEndDate.toISOString(),
          auto_renewal: true
        })
        .select()
        .single()

      if (subscriptionError) {
        console.error("Error creating trial subscription:", subscriptionError)
        return NextResponse.json(
          { error: "Error creando suscripción de prueba" },
          { status: 500 }
        )
      }

      // Actualizar la tienda con la referencia a la suscripción
      await supabase
        .from("stores")
        .update({
          subscription_id: subscription.id,
          subscription_status: "trial",
          subscription_expires_at: trialEndDate.toISOString()
        })
        .eq("id", storeId)

      return NextResponse.json({
        success: true,
        subscription_id: subscription.id,
        type: "trial",
        expires_at: trialEndDate.toISOString(),
        message: "Suscripción de prueba creada exitosamente"
      })
    }

    // Para planes pagados, crear preferencia de MercadoPago
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    
    if (!accessToken) {
      return NextResponse.json(
        { error: "MercadoPago no configurado" },
        { status: 500 }
      )
    }

    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: 5000,
        idempotencyKey: `subscription-${storeId}-${planId}-${Date.now()}`
      }
    })

    const preference = new Preference(client)

    // Crear la suscripción pendiente primero
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        store_id: storeId,
        plan_id: planId,
        status: "trial", // Empezará en trial hasta que se pague
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días de trial
        auto_renewal: true
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError)
      return NextResponse.json(
        { error: "Error creando suscripción" },
        { status: 500 }
      )
    }

    const preferenceData = {
      items: [
        {
          id: plan.id,
          title: `${plan.display_name} - ${store.name}`,
          description: plan.description || `Suscripción ${plan.display_name}`,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: plan.currency || "ARS"
        }
      ],
      payer: {
        email: user.email || ""
      },
      external_reference: subscription.id,
      payment_methods: {
        excluded_payment_types: [
          { id: "ticket" }, // Excluir pagos en efectivo
        ],
        installments: 1 // Sin cuotas para suscripciones
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/pending`
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/webhook`,
      statement_descriptor: "FOODYNOW SUSCRIPCION"
    }

    const preferenceResponse = await preference.create({ body: preferenceData })

    // Crear registro de pago pendiente
    const periodStart = new Date()
    const periodEnd = new Date()
    periodEnd.setDate(periodEnd.getDate() + plan.duration_days)

    await supabase
      .from("subscription_payments")
      .insert({
        subscription_id: subscription.id,
        plan_id: planId,
        amount: plan.price,
        currency: plan.currency || "ARS",
        status: "pending",
        mercadopago_preference_id: preferenceResponse.id,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        payer_email: user.email,
        external_reference: subscription.id
      })

    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      type: "paid",
      preference_id: preferenceResponse.id,
      init_point: preferenceResponse.init_point,
      sandbox_init_point: preferenceResponse.sandbox_init_point
    })

  } catch (error) {
    console.error("Error creating subscription:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
