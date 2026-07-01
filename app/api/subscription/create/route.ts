import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import {
  MERCADOPAGO_PLANS,
  getPlanTypeByHistory,
  generateCheckoutUrl,
  getTrialDays
} from '@/lib/config/subscription-plans'

export async function POST(request: Request) {
  try {
    const { storeId, planId, payerEmail } = await request.json()
    const supabase = await createClient()

    console.log('📝 Datos recibidos:', { storeId, planId, payerEmail })

    // Validar datos requeridos
    if (!storeId || !payerEmail) {
      return NextResponse.json({ 
        error: "Faltan datos requeridos: storeId, payerEmail" 
      }, { status: 400 })
    }

    // El planId puede ser un UUID o un nombre de plan
    const selectedPlanId = planId || 'basic_monthly'

    // Determinar si es UUID o nombre
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedPlanId)
    
    // Obtener plan por id o por name
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq(isUUID ? "id" : "name", selectedPlanId)
      .single()

    if (planError || !plan) {
      console.error('❌ Plan no encontrado:', { selectedPlanId, isUUID, planError })
      return NextResponse.json({ 
        error: "Plan no encontrado" 
      }, { status: 404 })
    }

    if (!plan.mercadopago_plan_id) {
      return NextResponse.json({ 
        error: "Plan no configurado en MercadoPago. Contacta al administrador." 
      }, { status: 400 })
    }

    // Verificar suscripciones existentes
    const { data: allSubscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })

    // Si tiene suscripción activa o trial, no puede crear otra
    const activeSubscription = allSubscriptions?.find(sub => 
      ['trial', 'active'].includes(sub.status)
    )

    if (activeSubscription) {
      console.log('⚠️ Ya tiene suscripción activa:', activeSubscription.status)
      return NextResponse.json({ 
        error: "La tienda ya tiene una suscripción activa" 
      }, { status: 409 })
    }

    // 🔄 Si tiene suscripciones viejas en estados inválidos, las eliminamos
    // para evitar el constraint de unique store_id
    if (allSubscriptions && allSubscriptions.length > 0) {
      console.log(`🗑️ Eliminando ${allSubscriptions.length} suscripción(es) antigua(s)...`)
      
      const oldSubscriptionIds = allSubscriptions.map(sub => sub.id)
      const { error: deleteError } = await supabase
        .from("subscriptions")
        .delete()
        .in('id', oldSubscriptionIds)

      if (deleteError) {
        console.error('❌ Error eliminando suscripciones viejas:', deleteError)
        // No bloqueamos el flujo, intentamos continuar
      } else {
        console.log('✅ Suscripciones antiguas eliminadas correctamente')
      }
    }

    // 🆕 PASO 1: Verificar si la tienda tuvo suscripciones antes (trial_used en stores)
    const { data: storeData } = await supabase
      .from('stores')
      .select('trial_used')
      .eq('id', storeId)
      .single()

    const hasUsedTrial = storeData?.trial_used === true

    // 🆕 PASO 2: Determinar plan correcto según historial
    const planType = getPlanTypeByHistory(hasUsedTrial)
    const _mercadoPagoPlanId = MERCADOPAGO_PLANS[planType].id
    const trialDays = getTrialDays(planType)

    console.log(`🔍 Store ${storeId}: hasUsedTrial=${hasUsedTrial}, planType=${planType}, trialDays=${trialDays}`)

    // Crear suscripción local primero (estado pending)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        store_id: storeId,
        plan_id: plan.id, // Usar el ID del plan de la base de datos
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
