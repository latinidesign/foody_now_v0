import { randomUUID } from "crypto"

import { getTenantSlugFromHost } from "@/lib/tenant"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"
import { getValidAccessToken } from "@/lib/mercadopago/SellerUtils"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const cid = randomUUID()

  const fail = (status: number, message: string, context?: unknown) => {
    console.error(`[payments:webhook][cid:${cid}] ${message}`, context)
    return NextResponse.json({ error: message, cid }, { status })
  }

  let body: any
  try {
    body = await request.json()
  } catch (parseError) {
    return fail(400, "Payload inválido", parseError)
  }

  const url = new URL(request.url)
  const tenantSlug = url.searchParams.get("tenant") ?? getTenantSlugFromHost(request.headers.get("host"))

  if (!tenantSlug) {
    return fail(400, "No se pudo determinar la tienda del webhook")
  }

  const eventType = body?.type ?? body?.topic
  if (eventType && eventType !== "payment") {
    return NextResponse.json({ received: true })
  }

  const paymentId = body?.data?.id ?? body?.data?.payment?.id ?? body?.id

  if (!paymentId) {
    return fail(400, "Webhook sin identificador de pago", body)
  }

  const supabase = createAdminClient()

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, slug, is_active")
    .eq("slug", tenantSlug)
    .single()

  if (storeError || !store) {
    return fail(404, "Tienda no encontrada", storeError)
  }

  if (!store.is_active) {
    return fail(403, "La tienda no está activa")
  }

  let accessToken: string

  try {
    accessToken = await getValidAccessToken(store.id)
  } catch (tokenError) {
    return fail(500, "No se pudo obtener token válido de MercadoPago", tokenError)
  }

  const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!paymentResponse.ok) {
    let errorBody: unknown

    try {
      errorBody = await paymentResponse.json()
    } catch (parseError) {
      errorBody = await paymentResponse.text().catch(() => undefined)
    }

    return fail(502, "No se pudo obtener los datos del pago", errorBody)
  }

  const payment = await paymentResponse.json()

  if (!payment?.external_reference) {
    return fail(400, "El pago no contiene external_reference", payment)
  }

  const { data: session, error: sessionError } = await supabase
    .from("checkout_sessions")
    .select("*")
    .eq("external_reference", payment.external_reference)
    .eq("store_id", store.id)
    .single()

  if (sessionError || !session) {
    return fail(404, "Sesión de checkout no encontrada para el pago", sessionError ?? payment)
  }

  const paymentIdString = paymentId.toString()

  const updateSession = async (values: Record<string, unknown>) => {
    const { error: updateError } = await supabase
      .from("checkout_sessions")
      .update({ ...values, updated_at: new Date().toISOString(), payment_id: paymentIdString })
      .eq("id", session.id)

    if (updateError) {
      console.error(`[payments:webhook][cid:${cid}] Error al actualizar checkout_session`, updateError)
    }
  }

  const updateOrderPaymentStatus = async (paymentStatus: string) => {
    if (!session.order_id) {
      return
    }

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", session.order_id)

    if (orderUpdateError) {
      console.error(
        `[payments:webhook][cid:${cid}] Error al actualizar el estado del pago en la orden`,
        orderUpdateError,
      )
    }
  }

  const paymentStatusMap: Record<string, "pending" | "completed" | "failed" | "refunded"> = {
    approved: "completed",
    rejected: "failed",
    cancelled: "failed",
    refunded: "refunded",
    charged_back: "refunded",
  }

  const mappedPaymentStatus = paymentStatusMap[payment.status as keyof typeof paymentStatusMap] ?? "pending"

  if (session.order_id) {
    await updateSession({ status: payment.status, payment_status: mappedPaymentStatus })
    await updateOrderPaymentStatus(mappedPaymentStatus)
    return NextResponse.json({ received: true })
  }

  if (payment.status === "approved") {
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
        status: "pending",
        payment_status: mappedPaymentStatus,
        payment_id: paymentIdString,
      })
      .select("*, stores (slug)")
      .single()

    if (orderError || !order) {
      return fail(500, "No se pudo crear la orden del pago", orderError)
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

    const sessionItems = Array.isArray(session.items) ? session.items : []

    if (sessionItems.length > 0) {
      const orderItems = sessionItems.map((item: any) => {
        const productId = item.id.split(":")[0]
        return {
          order_id: order.id,
          product_id: productId,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          selected_options: item.selectedOptions ?? null,
        }
      })

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        return fail(500, "No se pudieron registrar los productos de la orden", itemsError)
      }
    }

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
        console.error(`[payments:webhook][cid:${cid}] Error enviando notificación de nueva orden`, notificationError)
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
}
