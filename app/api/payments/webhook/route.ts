import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // MercadoPago sends different types of notifications
    if (body.type === "payment") {
      const paymentId = body.data.id

      // Get payment details from MercadoPago
      // Note: In production, you would need to get the access token for the specific store
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`, // This should be dynamic per store
        },
      })

      if (!paymentResponse.ok) {
        console.error("Failed to get payment details")
        return NextResponse.json({ error: "Failed to get payment details" }, { status: 400 })
      }

      const payment = await paymentResponse.json()
      const orderId = payment.external_reference

      // Update order status based on payment status
      let orderStatus = "pending"
      let paymentStatus = "pending"

      switch (payment.status) {
        case "approved":
          orderStatus = "confirmed"
          paymentStatus = "completed"
          break
        case "rejected":
          orderStatus = "cancelled"
          paymentStatus = "failed"
          break
        case "cancelled":
          orderStatus = "cancelled"
          paymentStatus = "failed"
          break
        case "refunded":
          paymentStatus = "refunded"
          break
        default:
          paymentStatus = "pending"
      }

      // Update order in database
      const { error } = await supabase
        .from("orders")
        .update({
          status: orderStatus,
          payment_status: paymentStatus,
          payment_id: paymentId.toString(),
        })
        .eq("id", orderId)

      if (error) {
        console.error("Failed to update order:", error)
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
      }

      // TODO: Send WhatsApp notification to store and customer
      console.log(`Order ${orderId} payment status updated to ${paymentStatus}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
