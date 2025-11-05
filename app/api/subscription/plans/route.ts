import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Obtener todos los planes activos
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true })

    if (error) {
      console.error("Error fetching subscription plans:", error)
      return NextResponse.json(
        { error: "Error obteniendo planes de suscripción" },
        { status: 500 }
      )
    }

    // Formatear los planes para el frontend
    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.display_name,
      description: plan.description,
      price: Number(plan.price),
      currency: plan.currency,
      frequency: plan.frequency,
      durationDays: plan.duration_days,
      trialDays: plan.trial_days,
      isTrial: plan.is_trial,
      features: plan.features || [],
      maxProducts: plan.max_products,
      maxOrdersPerMonth: plan.max_orders_per_month,
      priority: plan.priority
    }))

    return NextResponse.json({
      success: true,
      plans: formattedPlans
    })

  } catch (error) {
    console.error("Error in subscription plans API:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
