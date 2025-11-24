import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const MERCADOPAGO_API_URL = "https://api.mercadopago.com"

export async function POST(request: Request) {
  try {
    const { planId } = await request.json()
    const supabase = await createClient()

    // Obtener plan local
    const { data: plan, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single()

    if (error || !plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    if (plan.mercadopago_plan_id) {
      return NextResponse.json({ 
        success: true, 
        planId: plan.mercadopago_plan_id,
        message: "Plan ya existe en MercadoPago" 
      })
    }

    // Crear plan en MercadoPago
    const mpPlan = {
      reason: plan.display_name,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        repetitions: 12, // Máximo por año, se puede renovar
        billing_day_proportional: false,
        free_trial: {
          frequency: plan.trial_period_days,
          frequency_type: "days"
        },
        transaction_amount: plan.price
      },
      payment_methods_allowed: {
        payment_types: [
          { id: "credit_card" },
          { id: "debit_card" }
        ],
        payment_methods: [
          { id: "visa" },
          { id: "master" },
          { id: "amex" }
        ]
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ 
        error: "Configuración de MercadoPago incompleta" 
      }, { status: 500 })
    }

    const response = await fetch(`${MERCADOPAGO_API_URL}/preapproval_plan`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mpPlan)
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error("Error creando plan en MP:", responseData)
      return NextResponse.json({ 
        error: "Error creando plan en MercadoPago", 
        details: responseData 
      }, { status: response.status })
    }

    // Actualizar plan local con ID de MP
    const { error: updateError } = await supabase
      .from("subscription_plans")
      .update({ mercadopago_plan_id: responseData.id })
      .eq("id", planId)

    if (updateError) {
      console.error("Error actualizando plan local:", updateError)
      return NextResponse.json({ 
        error: "Error actualizando plan local" 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      planId: responseData.id,
      mpResponse: responseData
    })

  } catch (error) {
    console.error("Error en crear plan MP:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}