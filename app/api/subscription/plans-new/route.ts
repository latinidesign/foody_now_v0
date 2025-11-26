import { NextResponse } from "next/server"
import { getSubscriptionService } from "@/lib/services/subscription-service"

export async function GET() {
  try {
    const subscriptionService = getSubscriptionService()
    const plans = await subscriptionService.getPlans()

    return NextResponse.json({
      success: true,
      plans
    })

  } catch (error: any) {
    console.error("Error obteniendo planes:", error)
    return NextResponse.json({ 
      error: "Error obteniendo planes de suscripción",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      display_name,
      price,
      billing_frequency,
      trial_period_days,
      features
    } = body

    // Validaciones
    if (!name || !display_name || !price || !billing_frequency) {
      return NextResponse.json({
        error: "Faltan campos requeridos: name, display_name, price, billing_frequency"
      }, { status: 400 })
    }

    if (!['monthly', 'yearly'].includes(billing_frequency)) {
      return NextResponse.json({
        error: "billing_frequency debe ser 'monthly' o 'yearly'"
      }, { status: 400 })
    }

    if (price <= 0) {
      return NextResponse.json({
        error: "El precio debe ser mayor a 0"
      }, { status: 400 })
    }

    const subscriptionService = getSubscriptionService()
    
    const plan = await subscriptionService.createPlan({
      name,
      display_name,
      price: Number(price),
      billing_frequency,
      trial_period_days: trial_period_days || 15,
      is_trial: (trial_period_days || 15) > 0,
      features: features || [],
      is_active: true
    })

    return NextResponse.json({
      success: true,
      plan
    })

  } catch (error: any) {
    console.error("Error creando plan:", error)
    return NextResponse.json({ 
      error: "Error creando plan de suscripción",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
