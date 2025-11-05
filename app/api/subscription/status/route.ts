import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      )
    }

    // Obtener la tienda del usuario
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select(`
        id,
        name,
        subscription_id,
        subscription_status,
        subscription_expires_at,
        subscriptions (
          id,
          status,
          trial_started_at,
          trial_ends_at,
          paid_started_at,
          paid_ends_at,
          auto_renewal,
          subscription_plans (
            id,
            name,
            display_name,
            price,
            frequency,
            features
          )
        )
      `)
      .eq("user_id", user.id)
      .single()

    if (storeError || !store) {
      return NextResponse.json(
        { error: "Tienda no encontrada" },
        { status: 404 }
      )
    }

    // Si no tiene suscripción, devolver estado sin suscripción
    if (!store.subscription_id || !store.subscriptions || store.subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        hasSubscription: false,
        store: {
          id: store.id,
          name: store.name
        }
      })
    }

    const subscription = store.subscriptions[0] // Tomar la primera (debería ser única)
    const plan = subscription.subscription_plans?.[0] // Tomar el primer plan

    // Calcular días restantes
    let daysLeft = 0
    let isActive = false
    let expiresAt: string | null = null

    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      const now = new Date()
      if (trialEnd > now) {
        daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        isActive = true
        expiresAt = subscription.trial_ends_at
      }
    } else if (subscription.status === 'active' && subscription.paid_ends_at) {
      const paidEnd = new Date(subscription.paid_ends_at)
      const now = new Date()
      if (paidEnd > now) {
        daysLeft = Math.ceil((paidEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        isActive = true
        expiresAt = subscription.paid_ends_at
      }
    }

    return NextResponse.json({
      success: true,
      hasSubscription: true,
      isActive,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        daysLeft,
        expiresAt,
        autoRenewal: subscription.auto_renewal,
        plan: plan ? {
          id: plan.id,
          name: plan.name,
          displayName: plan.display_name,
          price: Number(plan.price),
          frequency: plan.frequency,
          features: plan.features
        } : null
      },
      store: {
        id: store.id,
        name: store.name
      }
    })

  } catch (error) {
    console.error("Error checking subscription status:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
