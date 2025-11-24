import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")

    if (!storeId) {
      return NextResponse.json({ 
        error: "storeId requerido" 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Obtener suscripción con plan
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Error obteniendo suscripción:", error)
      return NextResponse.json({ 
        error: "Error consultando suscripción" 
      }, { status: 500 })
    }

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        status: "none",
        message: "No hay suscripción activa"
      })
    }

    // Calcular días restantes
    let daysRemaining = 0
    const now = new Date()

    if (subscription.status === "trial" && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    } else if (subscription.next_billing_date) {
      const nextBilling = new Date(subscription.next_billing_date)
      daysRemaining = Math.max(0, Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Determinar si está activa
    const isActive = ["trial", "active"].includes(subscription.status) && daysRemaining > 0

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planName: subscription.plan?.display_name,
        price: subscription.plan?.price,
        trialEndsAt: subscription.trial_ends_at,
        nextBillingDate: subscription.next_billing_date,
        lastPaymentDate: subscription.last_payment_date,
        daysRemaining,
        isActive,
        mercadopagoPreapprovalId: subscription.mercadopago_preapproval_id
      }
    })

  } catch (error) {
    console.error("Error en status de suscripción:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
