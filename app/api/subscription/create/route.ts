import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getSubscriptionService } from "@/lib/services/subscription-service"

const MERCADOPAGO_API_URL = "https://api.mercadopago.com"

export async function POST(request: Request) {
  try {
    const { storeId, planId, cardToken, payerEmail } = await request.json()
    const supabase = await createClient()

    // Validar datos requeridos
    if (!storeId || !planId || !payerEmail) {
      return NextResponse.json({ 
        error: "Faltan datos requeridos: storeId, planId, payerEmail" 
      }, { status: 400 })
    }

    // Obtener plan
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ 
        error: "Plan no encontrado" 
      }, { status: 404 })
    }

    if (!plan.mercadopago_plan_id) {
      return NextResponse.json({ 
        error: "Plan no configurado en MercadoPago. Contacta al administrador." 
      }, { status: 400 })
    }

    // Verificar que la tienda no tenga suscripción activa
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("store_id", storeId)
      .in("status", ["trial", "active"])
      .maybeSingle()

    if (existingSubscription) {
      return NextResponse.json({ 
        error: "La tienda ya tiene una suscripción activa" 
      }, { status: 409 })
    }

    // Crear preapproval en MercadoPago
    const preapproval: any = {
      preapproval_plan_id: plan.mercadopago_plan_id,
      reason: `Suscripción FoodyNow - ${plan.display_name}`,
      payer_email: payerEmail,
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      auto_recurring: {
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 año
      }
    }

    // Agregar token de tarjeta si se proporciona
    if (cardToken) {
      preapproval.card_token_id = cardToken
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ 
        error: "Configuración de MercadoPago no disponible" 
      }, { status: 500 })
    }

    const response = await fetch(`${MERCADOPAGO_API_URL}/preapproval`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(preapproval)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("Error creando preapproval:", responseData)
      return NextResponse.json({ 
        error: "Error creando suscripción en MercadoPago",
        details: responseData 
      }, { status: response.status })
    }

    // Crear suscripción local
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + plan.trial_period_days)

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        store_id: storeId,
        plan_id: planId,
        status: "trial",
        mercadopago_preapproval_id: responseData.id,
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
        auto_renewal: true
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error("Error creando suscripción local:", subscriptionError)
      return NextResponse.json({ 
        error: "Error creando suscripción local" 
      }, { status: 500 })
    }

    // Actualizar tienda
    const { error: storeUpdateError } = await supabase
      .from("stores")
      .update({
        subscription_id: subscription.id,
        subscription_status: "trial",
        subscription_expires_at: trialEndsAt.toISOString()
      })
      .eq("id", storeId)

    if (storeUpdateError) {
      console.error("Error actualizando tienda:", storeUpdateError)
    }

    return NextResponse.json({
      success: true,
      subscription: subscription,
      init_point: responseData.init_point,
      preapproval_id: responseData.id,
      trial_days: plan.trial_period_days
    })

  } catch (error) {
    console.error("Error creando suscripción:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
