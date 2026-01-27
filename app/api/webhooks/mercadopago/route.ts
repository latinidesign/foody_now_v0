import { NextRequest } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { createAdminClient } from '@/lib/supabase/admin'

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})



export async function POST(req: NextRequest) {
  const supabase = createAdminClient()    
  try {
    const body = await req.json()
    console.log("MP Webhook received:", body)

    if (body.type !== "payment") {
      return new Response(null, { status: 200 })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      console.warn("No payment id")
      return new Response(null, { status: 200 })
    }

    // Consultar pago en Mercado Pago
    const paymentClient = new Payment(mp)
    const payment = await paymentClient.get({ id: paymentId })

    const {
      status,
      external_reference,
      transaction_amount,
      payer,
    } = payment

    if (!external_reference) {
      console.warn("Payment without external_reference")
      return new Response(null, { status: 200 })
    }

    if(payment === null || payment === undefined) {
      console.warn("Payment not found in Mercado Pago:", paymentId)
      return new Response(null, { status: 200 })
    }
    console.log("Payment details:", payment)

    // Buscar suscripción en Supabase para el usuario indicado en la external_reference
    const parts = external_reference.split("_")

    // ["user", "123", "plan", "basic_frequency", "1705948123456"]

    const userIndex = parts.indexOf("user")
    const planIndex = parts.indexOf("plan")

    if (userIndex === -1 || planIndex === -1) {
      console.warn("Invalid external_reference format:", external_reference)
      return new Response(null, { status: 200 })
    }

    const userId = parts[userIndex + 1]
    const planName = parts[planIndex + 1]
    const planId = planName === "basic-monthly" ? "basic-monthly" : planName === "basic-quarterly" ? "basic-quarterly" : "basic-yearly"
    
    const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "pending"])
    .maybeSingle()


    if(subscription === null || subscription === undefined) {
      console.log("No active subscription found for user:", userId)
    }

    if (status === "approved") {

      console.log("Processing approved payment for user:", userId, "plan:", planId)

      let subscriptionId = subscription?.id

      if (!subscription) {
        console.log("Creating new subscription for user:", userId)
        let days = planId === "basic-monthly" ? 30 : planId === "basic-quarterly" ? 90 : 365
        // Crear nueva suscripción
        const { data: newSubscription, error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            plan_name: planId,
            status: "active",
            paid_started_at: new Date().toISOString(),
            paid_ends_at: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),  // su suman los dias que cubre el plan
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
        
          if (insertError || !newSubscription) {
            console.error("Failed to create subscription:", insertError)
            return new Response(null, { status: 200 })
          }

          subscriptionId = newSubscription.id
      } else {
        console.log("Updating existing subscription for user:", userId)
        // Actualizar suscripción existente para extender la fecha de fin, que es la duracion en dias desde el final del periodo anterior, indicado en paid_ends_at (esto es para cuando renueva una suscripcion ya activa). Si la suscripcion estaba vencida, se toma la fecha actual.
        const currentEndDate = new Date(subscription.paid_ends_at)
        const startDate = currentEndDate > new Date() ? currentEndDate : new Date()
        let days = planId === "basic-monthly" ? 30 : planId === "basic-quarterly" ? 90 : 365
        const newEndDate = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)

        await supabase
          .from("subscriptions")
          .update({
            paid_ends_at: newEndDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscriptionId)
      }

      // Guardar el pago
      const { data: newSubscriptionPayment, error: insertError } = await supabase.from("subscription_payments").insert({
        subscription_id: subscriptionId,
        mercadopago_payment_id: paymentId,
        amount: transaction_amount,
        status: payment.status,
        payer_email: payer?.email ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError || !newSubscriptionPayment) {
            console.error("Failed to create subscription payment:", insertError)
            return new Response(null, { status: 200 })
          }
    }


    return new Response(null, { status: 200 })
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(null, { status: 200 })
  }
}
