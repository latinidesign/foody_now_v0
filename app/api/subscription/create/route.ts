import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { storeId, planId, payerEmail } = await request.json()
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

    // Crear suscripción local primero (estado pending)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + (plan.trial_period_days || 7))

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        store_id: storeId,
        plan_id: planId,
        status: "pending",
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

    // Crear URL de checkout directa usando el plan de MercadoPago
    const backUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription/success?subscription_id=${subscription.id}`
    const checkoutUrl = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${plan.mercadopago_plan_id}&back_url=${encodeURIComponent(backUrl)}`

    // Actualizar tienda con la suscripción
    const { error: storeUpdateError } = await supabase
      .from("stores")
      .update({
        subscription_id: subscription.id,
        subscription_status: "pending",
        subscription_expires_at: trialEndsAt.toISOString()
      })
      .eq("id", storeId)

    if (storeUpdateError) {
      console.error("Error actualizando tienda:", storeUpdateError)
    }

    return NextResponse.json({
      success: true,
      subscription: subscription,
      init_point: checkoutUrl,
      trial_days: plan.trial_period_days || 7
    })

  } catch (error) {
    console.error("Error creando suscripción:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
