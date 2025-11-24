// app/api/subscription/cancel/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const MERCADOPAGO_API_URL = "https://api.mercadopago.com"

export async function POST(request: Request) {
  try {
    const { subscriptionId, reason } = await request.json()
    const supabase = await createClient()

    if (!subscriptionId) {
      return NextResponse.json({ 
        error: "ID de suscripción requerido" 
      }, { status: 400 })
    }

    // Obtener suscripción
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*, stores(*)")
      .eq("id", subscriptionId)
      .single()

    if (error || !subscription) {
      return NextResponse.json({ 
        error: "Suscripción no encontrada" 
      }, { status: 404 })
    }

    // Cancelar en MercadoPago si existe preapproval
    if (subscription.mercadopago_preapproval_id) {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
      
      if (accessToken) {
        try {
          const response = await fetch(
            `${MERCADOPAGO_API_URL}/preapproval/${subscription.mercadopago_preapproval_id}`,
            {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ 
                status: "cancelled",
                reason: reason || "Cancelado por el usuario"
              })
            }
          )

          if (!response.ok) {
            const errorData = await response.json()
            console.error("Error cancelando en MP:", errorData)
            // Continuar con cancelación local aunque falle en MP
          }
        } catch (mpError) {
          console.error("Error comunicándose con MP:", mpError)
          // Continuar con cancelación local
        }
      }
    }

    // Actualizar suscripción local
    const { data: updatedSubscription, error: updateError } = await supabase
      .from("subscriptions")
      .update({ 
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", subscriptionId)
      .select()
      .single()

    if (updateError) {
      console.error("Error actualizando suscripción:", updateError)
      return NextResponse.json({ 
        error: "Error cancelando suscripción" 
      }, { status: 500 })
    }

    // Actualizar tienda (el trigger debería hacerlo, pero por seguridad)
    await supabase
      .from("stores")
      .update({
        subscription_status: "cancelled"
      })
      .eq("id", subscription.store_id)

    return NextResponse.json({
      success: true,
      subscription: updatedSubscription,
      message: "Suscripción cancelada exitosamente"
    })

  } catch (error) {
    console.error("Error cancelando suscripción:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}