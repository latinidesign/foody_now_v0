import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // MercadoPago sends different types of notifications
     if (body.type !== "payment") {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id

    if (!paymentId) {
      console.error("Webhook payload missing payment id", body)
      return NextResponse.json({ error: "Missing payment id" }, { status: 400 })
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN is not configured")
      return NextResponse.json({ error: "Configuration error" }, { status: 500 })
    }

    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!paymentResponse.ok) {
      console.error("Failed to get payment details")
      return NextResponse.json({ error: "Failed to get payment details" }, { status: 400 })
    }

    const payment = await paymentResponse.json()

    if (!payment.external_reference) {
      console.error("Payment missing external reference", payment)
      return NextResponse.json({ error: "Payment missing external reference" }, { status: 400 })
    }

    const { data: session, error: sessionError } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("external_reference", payment.external_reference)
      .single()

    if (sessionError || !session) {
      console.error("Checkout session not found for payment", paymentId, sessionError)
      return NextResponse.json({ error: "Checkout session not found" }, { status: 404 })
    }

    const updateSession = async (values: Record<string, unknown>) => {
      await supabase
        .from("checkout_sessions")
        .update({ ...values, updated_at: new Date().toISOString(), payment_id: paymentId.toString() })
        .eq("id", session.id)
    }

    const paymentStatusMap: Record<string, "pending" | "completed" | "failed" | "refunded"> = {
      approved: "completed",
      rejected: "failed",
      cancelled: "failed",
      refunded: "refunded",
    }

    const mappedPaymentStatus = paymentStatusMap[payment.status as keyof typeof paymentStatusMap] ?? "pending"

    if (payment.status === "approved") {
      if (session.order_id) {
        await updateSession({ status: payment.status, payment_status: mappedPaymentStatus })
        return NextResponse.json({ received: true })
      }


      const sessionOrderData = (session.order_data ?? {}) as any
      const customerName = sessionOrderData.customerName ?? ""
      const customerPhone = sessionOrderData.customerPhone ?? ""
      const customerEmail = sessionOrderData.customerEmail ?? null
      const deliveryType = sessionOrderData.deliveryType ?? "pickup"
      const deliveryAddress = sessionOrderData.deliveryAddress ?? null
      const deliveryNotes = sessionOrderData.deliveryNotes ?? null

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: session.store_id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          delivery_type: deliveryType,
          delivery_address: deliveryAddress,
          delivery_notes: deliveryNotes,
          subtotal: session.subtotal ?? 0,
          delivery_fee: session.delivery_fee ?? 0,
          total: session.total ?? 0,
          status: "confirmed",
          payment_status: mappedPaymentStatus,
          payment_id: paymentId.toString(),
        })
        .select("*, stores (slug)")
        .single()

      if (orderError || !order) {
        console.error("Failed to create order from checkout session", orderError)
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
      }

      const sessionItems = Array.isArray(session.items) ? session.items : []

      if (sessionItems.length > 0) {
        const orderItems = sessionItems.map((item: any) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          selected_options: item.selectedOptions ?? null,
        }))

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

        if (itemsError) {
          console.error("Failed to create order items", itemsError)
          return NextResponse.json({ error: "Failed to create order items" }, { status: 500 })
        }
      }

      await updateSession({
        status: payment.status,
        payment_status: mappedPaymentStatus,
        order_id: order.id,
        processed_at: new Date().toISOString(),
        items: null,
        order_data: null,
        subtotal: null,
        delivery_fee: null,
        total: null,
      })

      if (process.env.NEXT_PUBLIC_APP_URL) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/order-created`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: order.id,
              storeSlug: order.stores?.slug,
            }),
          })
        } catch (notificationError) {
          console.error("Failed to trigger order notification", notificationError)
        }
      }

      return NextResponse.json({ received: true })
    }

    if (payment.status === "rejected" || payment.status === "cancelled") {
      await updateSession({
        status: payment.status,
        payment_status: mappedPaymentStatus,
        processed_at: new Date().toISOString(),
        items: null,
        order_data: null,
        subtotal: null,
        delivery_fee: null,
        total: null,
      })

      return NextResponse.json({ received: true })
    }

    await updateSession({ status: payment.status, payment_status: mappedPaymentStatus })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
