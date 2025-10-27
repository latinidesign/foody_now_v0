import { randomUUID } from "crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { mapOrderStatus, mapPaymentStatus } from "@/lib/payments"
import { enqueueCustomerConfirmation } from "@/lib/queue/queue-initializer"
import { sendStoreNotification, buildPaymentReceivedNotification } from "@/lib/notifications/store-notifications"

export const runtime = "nodejs"

const PROVIDER_KEY = "mercadopago"

type MercadoPagoPayment = {
  status?: string
  transaction_amount?: number
  currency_id?: string
  payer?: { email?: string }
  collector_id?: string | number
  external_reference?: string
  order?: { id?: string }
  metadata?: Record<string, unknown>
  payment_method_id?: string
  payment_type_id?: string
  status_detail?: string
}

type SupabasePaymentRow = {
  id: string
  order_id: string | null
  store_id: string | null
  preference_id: string | null
  provider?: string | null
  provider_payment_id?: string | null
}

function isIdempotentConflict(error: unknown) {
  const potentialMessage =
    typeof error === "object" && error !== null && "message" in error
      ? (error as { message?: unknown }).message
      : undefined

  const message = typeof potentialMessage === "string" ? potentialMessage : String(error ?? "")
  return message.includes("duplicate key value") || message.includes("unique constraint")
}

export async function POST(request: Request) {
  const cid = randomUUID()

  const supabase = createAdminClient()

  const fail = (message: string, context?: unknown) => {
    console.error(`[webhooks:mercadopago][cid:${cid}] ${message}`, context)
  }

  let payload: any = {}

  try {
    payload = await request.json()
  } catch (error) {
    fail("Unable to parse webhook payload", error)
  }

  const url = new URL(request.url)
  const storeIdFromQuery = url.searchParams.get("store_id")
  const storeSlugFromQuery = url.searchParams.get("store_slug")

  const paymentId =
    payload?.data?.id ?? payload?.data?.payment?.id ?? payload?.id ?? payload?.resource?.split("/").pop()

  if (!paymentId) {
    fail("Webhook received without payment identifier", payload)
    return NextResponse.json({ ok: true, cid })
  }

  let resolvedStoreId: string | null = storeIdFromQuery
  let resolvedOrderId: string | null = null
  let existingPayment: SupabasePaymentRow | null = null

  if (!resolvedStoreId && storeSlugFromQuery) {
    const { data: storeBySlug } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlugFromQuery)
      .single()

    resolvedStoreId = storeBySlug?.id ?? null
  }

  if (!resolvedStoreId) {
    const { data: paymentRows } = await supabase
      .from("payments")
      .select("id, order_id, store_id, preference_id, provider, provider_payment_id, mp_payment_id")
      .eq("provider", PROVIDER_KEY)
      .eq("provider_payment_id", String(paymentId))
      .limit(1)

    let paymentMatch: SupabasePaymentRow | null = paymentRows?.[0] ? (paymentRows[0] as SupabasePaymentRow) : null

    if (!paymentMatch) {
      const { data: fallbackRows } = await supabase
        .from("payments")
        .select("id, order_id, store_id, preference_id, provider, provider_payment_id, mp_payment_id")
        .eq("mp_payment_id", String(paymentId))
        .limit(1)

      paymentMatch = fallbackRows?.[0] ? (fallbackRows[0] as SupabasePaymentRow) : null
    }

    if (paymentMatch) {
      existingPayment = paymentMatch
      resolvedStoreId = paymentMatch.store_id ?? null
      resolvedOrderId = paymentMatch.order_id ?? null
    }
  }

  let mercadopagoAccessToken: string | null = null

  if (resolvedStoreId) {
    const { data: settings, error: settingsError } = await supabase
      .from("store_settings")
      .select("mercadopago_access_token")
      .eq("store_id", resolvedStoreId)
      .single()

    if (settingsError) {
      fail("Unable to load store settings", settingsError)
    }

    mercadopagoAccessToken = settings?.mercadopago_access_token ?? null
  }

  if (!resolvedStoreId) {
    fail("Unable to resolve store for payment", { paymentId, payload })
  }

  let paymentDetail: MercadoPagoPayment | null = null

  if (mercadopagoAccessToken) {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mercadopagoAccessToken}`,
      },
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      fail("Mercado Pago payment fetch failed", { status: response.status, body })
    } else {
      paymentDetail = body as MercadoPagoPayment
    }
  }

  if (!paymentDetail) {
    paymentDetail = {
      status: payload?.status,
      metadata: payload?.metadata,
    }
  }

  const orderIdFromPayment =
    paymentDetail?.external_reference || paymentDetail?.metadata?.order_id || resolvedOrderId || null

  let storeIdFromOrder: string | null = null

  if (orderIdFromPayment) {
    const { data: orderRecord } = await supabase
      .from("orders")
      .select("id, store_id")
      .eq("id", orderIdFromPayment)
      .single()

    if (orderRecord) {
      storeIdFromOrder = orderRecord.store_id
      if (!resolvedStoreId) {
        resolvedStoreId = orderRecord.store_id
      }
    }
  }

  if (!existingPayment && paymentDetail?.order?.id) {
    const { data: paymentRowsByPreference } = await supabase
      .from("payments")
      .select("id, order_id, store_id, preference_id, provider, provider_payment_id")
      .eq("preference_id", paymentDetail.order.id)
      .eq("provider", PROVIDER_KEY)
      .limit(1)

    if (paymentRowsByPreference && paymentRowsByPreference.length > 0) {
      existingPayment = paymentRowsByPreference[0] as SupabasePaymentRow
      resolvedOrderId = resolvedOrderId ?? existingPayment.order_id
      resolvedStoreId = resolvedStoreId ?? existingPayment.store_id
    }
  }

  if (!existingPayment && resolvedOrderId) {
    const { data: paymentRowsByOrder } = await supabase
      .from("payments")
      .select("id, order_id, store_id, preference_id, provider, provider_payment_id")
      .eq("order_id", resolvedOrderId)
      .eq("provider", PROVIDER_KEY)
      .order("created_at", { ascending: false })
      .limit(1)

    if (paymentRowsByOrder && paymentRowsByOrder.length > 0) {
      existingPayment = paymentRowsByOrder[0] as SupabasePaymentRow
      resolvedStoreId = resolvedStoreId ?? existingPayment.store_id
    }
  }

  if (!resolvedStoreId && storeIdFromOrder) {
    resolvedStoreId = storeIdFromOrder
  }

  if (!mercadopagoAccessToken && resolvedStoreId) {
    const { data: settings } = await supabase
      .from("store_settings")
      .select("mercadopago_access_token")
      .eq("store_id", resolvedStoreId)
      .single()

    mercadopagoAccessToken = settings?.mercadopago_access_token ?? null
  }

  if (!paymentDetail && mercadopagoAccessToken) {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mercadopagoAccessToken}`,
      },
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      fail("Mercado Pago payment fetch failed on retry", { status: response.status, body })
    } else {
      paymentDetail = body as MercadoPagoPayment
    }
  }

  const status = paymentDetail?.status ?? payload?.status ?? "unknown"
  const amount = paymentDetail?.transaction_amount ?? null
  const currency = paymentDetail?.currency_id ?? "ARS"
  const payerEmail = paymentDetail?.payer?.email ?? null
  const collectorId = paymentDetail?.collector_id ? String(paymentDetail.collector_id) : null

  const finalOrderId = orderIdFromPayment ?? existingPayment?.order_id ?? resolvedOrderId
  const finalStoreId = resolvedStoreId ?? existingPayment?.store_id ?? storeIdFromOrder

  if (!finalOrderId || !finalStoreId) {
    fail("Missing order or store information for payment", {
      paymentId,
      orderIdFromPayment,
      resolvedOrderId,
      resolvedStoreId,
    })
    return NextResponse.json({ ok: true, cid })
  }

  const paymentRecord = {
    order_id: finalOrderId,
    store_id: finalStoreId,
    provider: PROVIDER_KEY,
    provider_payment_id: String(paymentId),
    preference_id: paymentDetail?.order?.id ?? existingPayment?.preference_id ?? null,
    mp_payment_id: String(paymentId),
    payment_method: paymentDetail?.payment_method_id ?? null,
    source_type: paymentDetail?.payment_type_id ?? null,
    status,
    status_detail: paymentDetail?.status_detail ?? null,
    transaction_amount: amount,
    currency,
    payer_email: payerEmail,
    collector_id: collectorId,
    metadata: paymentDetail?.metadata ?? payload?.metadata ?? null,
    raw: paymentDetail ?? payload,
  }

  const { error: upsertError } = await supabase
    .from("payments")
    .upsert(paymentRecord, { onConflict: "provider,provider_payment_id" })

  if (upsertError && !isIdempotentConflict(upsertError)) {
    fail("Unable to persist payment", upsertError)
  }

  if (finalOrderId) {
    const mappedPaymentStatus = mapPaymentStatus(PROVIDER_KEY, status)
    const mappedOrderStatus = mapOrderStatus(PROVIDER_KEY, status)

    const updates: Record<string, unknown> = {
      payment_status: mappedPaymentStatus,
      payment_id: String(paymentId),
    }

    if (mappedOrderStatus) {
      updates.status = mappedOrderStatus
    }

    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", finalOrderId)

    if (orderUpdateError) {
      fail("Unable to update order status", orderUpdateError)
    }

    // Enviar notificaciones cuando el pago se aprueba
    if (mappedPaymentStatus === 'completed' || mappedOrderStatus === 'confirmed') {
      try {
        if (typeof finalOrderId === 'string' && typeof finalStoreId === 'string') {
          await handlePaymentApprovedNotifications(finalOrderId, finalStoreId, cid)
        }
      } catch (error) {
        console.error(`[webhooks:mercadopago][cid:${cid}] Failed to send notifications:`, error)
        // No fallar el webhook por problemas de notificaciones
      }
    }
  }

  return NextResponse.json({ ok: true, cid })
}

// Función para enviar notificaciones cuando se aprueba un pago
async function handlePaymentApprovedNotifications(orderId: string, storeId: string, cid: string) {
  const supabase = createAdminClient()

  // Obtener detalles del pedido y la tienda
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      customer_phone,
      customer_email,
      total,
      delivery_type,
      delivery_address,
      order_items (
        quantity,
        unit_price,
        products (name)
      )
    `)
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error(`[webhooks:mercadopago][cid:${cid}] Failed to fetch order:`, orderError)
    return
  }

  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name, slug')
    .eq('id', storeId)
    .single()

  if (storeError || !store) {
    console.error(`[webhooks:mercadopago][cid:${cid}] Failed to fetch store:`, storeError)
    return
  }

  // 1. Enviar push notification a la tienda
  try {
    const pushPayload = buildPaymentReceivedNotification({
      orderId: order.id,
      customerName: order.customer_name,
      total: order.total,
    })

    await sendStoreNotification(storeId, pushPayload)
    console.log(`[webhooks:mercadopago][cid:${cid}] Store notification sent`)

    // Marcar como notificado
    await supabase
      .from('orders')
      .update({ 
        store_notified_at: new Date().toISOString(),
        notification_status: { push_sent: true }
      })
      .eq('id', orderId)

  } catch (error) {
    console.error(`[webhooks:mercadopago][cid:${cid}] Failed to send store notification:`, error)
  }

  // 2. Encolar mensaje de WhatsApp para el cliente
  if (order.customer_phone) {
    try {
      const items = order.order_items?.map((item: any) => ({
        name: item.products?.name || 'Producto',
        quantity: item.quantity,
        price: item.unit_price,
      })) || []

      await enqueueCustomerConfirmation({
        orderId: order.id,
        storeId,
        customerPhone: order.customer_phone,
        customerName: order.customer_name,
        storeName: store.name,
        total: order.total,
        items,
        deliveryType: order.delivery_type as 'pickup' | 'delivery',
        deliveryAddress: order.delivery_address,
        estimatedTime: '30-45 min', // Por defecto, se puede hacer configurable
      })

      console.log(`[webhooks:mercadopago][cid:${cid}] Customer WhatsApp message enqueued`)

      // Actualizar estado de notificación
      await supabase
        .from('orders')
        .update({ 
          customer_notified_at: new Date().toISOString(),
          notification_status: { push_sent: true, whatsapp_enqueued: true }
        })
        .eq('id', orderId)

    } catch (error) {
      console.error(`[webhooks:mercadopago][cid:${cid}] Failed to enqueue customer WhatsApp:`, error)
    }
  } else {
    console.warn(`[webhooks:mercadopago][cid:${cid}] No customer phone for WhatsApp notification`)
  }
}