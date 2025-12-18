import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { 
  MERCADOPAGO_PLANS, 
  getPlanTypeByHistory, 
  generateCheckoutUrl,
  STATES_WITH_TRIAL_USED,
  getTrialDays
} from '@/lib/config/subscription-plans'

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

    // 🆕 PASO 1: Verificar si la tienda tiene historial de suscripciones
    const { data: previousSubscriptions } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('store_id', storeId)
      .in('status', STATES_WITH_TRIAL_USED)
      .limit(1)

    const hasUsedTrial = !!(previousSubscriptions && previousSubscriptions.length > 0)

    // 🆕 PASO 2: Determinar plan correcto según historial
    const planType = getPlanTypeByHistory(hasUsedTrial)
    const mercadoPagoPlanId = MERCADOPAGO_PLANS[planType].id
    const trialDays = getTrialDays(planType)

    console.log(`🔍 Store ${storeId}: hasUsedTrial=${hasUsedTrial}, planType=${planType}, trialDays=${trialDays}`)

    // Crear suscripción local primero (estado pending)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        store_id: storeId,
        plan_id: planId,
        status: "pending",
        trial_started_at: trialDays > 0 ? new Date().toISOString() : null,
        trial_ends_at: trialDays > 0 ? trialEndsAt.toISOString() : null,
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

    // 🆕 PASO 3: Crear URL de checkout con el plan correcto
    const backUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription/success?subscription_id=${subscription.id}`
    const checkoutUrl = generateCheckoutUrl(planType, backUrl)

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
      trial_days: trialDays,
      plan_type: planType,  // Para debugging
      has_used_trial: hasUsedTrial  // Para debugging
    })

  } catch (error) {
    console.error("Error creando suscripción:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
