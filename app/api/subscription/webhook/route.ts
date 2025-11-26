import { NextResponse } from "next/server"
import { getSubscriptionService } from "@/lib/services/subscription-service"
import { MercadoPagoWebhookEvent } from "@/lib/types/subscription"

export async function POST(request: Request) {
  try {
    const body: MercadoPagoWebhookEvent = await request.json()
    
    console.log("🔔 Webhook recibido:", {
      type: body.type,
      action: body.action,
      id: body.data?.id
    })

    const subscriptionService = getSubscriptionService()
    
    // Procesar el webhook usando el servicio
    await subscriptionService.handleWebhook(body)

    return NextResponse.json({ 
      received: true, 
      processed: true 
    })

  } catch (error: any) {
    console.error("❌ Error procesando webhook:", error)
    return NextResponse.json({ 
      error: "Error procesando webhook",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// Funciones auxiliares removidas - ahora se maneja en el servicio

    if (!response.ok) {
      console.error("Error obteniendo preapproval desde MP")
      return NextResponse.json({ error: "Error consultando MP" }, { status: 500 })
    }

    const preapproval = await response.json()
    
    // Buscar suscripción local
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("mercadopago_preapproval_id", preapprovalId)
      .single()

    if (!subscription) {
      console.log(`⚠️ Suscripción no encontrada para preapproval: ${preapprovalId}`)
      return NextResponse.json({ received: true })
    }

    // Mapear estado de MP a estado local
    let newStatus = subscription.status
    let nextBillingDate = null
    let billingStartedAt = null

    switch (preapproval.status) {
      case "authorized":
        if (subscription.status === "trial") {
          // Trial autorizado, sigue en trial hasta que termine
          console.log("✅ Preapproval autorizado, trial continúa")
        } else {
          newStatus = "active"
          billingStartedAt = new Date().toISOString()
          nextBillingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 días
        }
        break

      case "paused":
        newStatus = "past_due"
        break

      case "cancelled":
        newStatus = "cancelled"
        break
    }

    // Actualizar suscripción
    const updateData: any = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (billingStartedAt) updateData.billing_started_at = billingStartedAt
    if (nextBillingDate) updateData.next_billing_date = nextBillingDate

    await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", subscription.id)

    console.log(`✅ Suscripción ${subscription.id} actualizada a estado: ${newStatus}`)

    return NextResponse.json({ 
      success: true, 
      action: `preapproval_${event.action}`,
      status: newStatus
    })

  } catch (error) {
    console.error("Error manejando evento preapproval:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

async function handlePaymentEvent(event: MercadoPagoWebhookEvent, supabase: any) {
  try {
    const paymentId = event.data.id
    
    // Obtener información del pago desde MP
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    const response = await fetch(`${MERCADOPAGO_API_URL}/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      console.error("Error obteniendo pago desde MP")
      return NextResponse.json({ error: "Error consultando MP" }, { status: 500 })
    }

    const payment = await response.json()
    
    // Buscar suscripción por preapproval_id si existe
    let subscription = null
    if (payment.preapproval_id) {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("mercadopago_preapproval_id", payment.preapproval_id)
        .single()
      
      subscription = data
    }

    if (!subscription) {
      console.log(`⚠️ Pago de suscripción no asociado: ${paymentId}`)
      return NextResponse.json({ received: true })
    }

    // Registrar el pago
    if (payment.status === "approved") {
      const billingStart = new Date()
      const billingEnd = new Date(billingStart.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 días

      // Guardar pago en historial
      await supabase
        .from("subscription_payments")
        .insert({
          subscription_id: subscription.id,
          mercadopago_payment_id: paymentId,
          amount: payment.transaction_amount,
          status: "approved",
          payment_date: payment.date_approved || new Date().toISOString(),
          billing_period_start: billingStart.toISOString(),
          billing_period_end: billingEnd.toISOString()
        })

      // Actualizar suscripción
      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          last_payment_date: payment.date_approved || new Date().toISOString(),
          next_billing_date: billingEnd.toISOString(),
          billing_started_at: subscription.billing_started_at || billingStart.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", subscription.id)

      console.log(`💰 Pago aprobado para suscripción ${subscription.id}: $${payment.transaction_amount}`)
    }

    return NextResponse.json({ 
      success: true, 
      action: `payment_${event.action}`,
      status: payment.status
    })

  } catch (error) {
    console.error("Error manejando evento de pago:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// Verificar webhook (GET para testing)
export async function GET() {
  return NextResponse.json({ 
    status: "Webhook de suscripciones activo",
    timestamp: new Date().toISOString()
  })
}