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

  // Detectar el tipo de webhook (payment o merchant_order)
  const webhookType = url.searchParams.get("topic") || payload?.type
  
  console.log(`[webhooks:mercadopago][cid:${cid}] Webhook received - Type: ${webhookType}, Payload:`, payload)

  // Extraer ID según el tipo de webhook
  let entityId: string | null = null
  
  if (webhookType === "merchant_order") {
    entityId = payload?.data?.id ?? payload?.id ?? url.searchParams.get("id")
  } else {
    // payment webhook
    entityId = payload?.data?.id ?? payload?.data?.payment?.id ?? payload?.id ?? payload?.resource?.split("/").pop()
  }

  if (!entityId) {
    fail("Webhook received without entity identifier", { webhookType, payload })
    return NextResponse.json({ ok: true, cid })
  }

  // Si es merchant_order, necesitamos obtener los payments de esa orden
  if (webhookType === "merchant_order") {
    return handleMerchantOrderWebhook(request, cid, entityId, storeSlugFromQuery, storeIdFromQuery)
  }

  // Continuar con el flujo original para payment webhooks
  const paymentId = entityId

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

    const pushResult = await sendStoreNotification(storeId, pushPayload)
    
    if (pushResult) {
      console.log(`[webhooks:mercadopago][cid:${cid}] Store notification sent`)
    } else {
      console.warn(`[webhooks:mercadopago][cid:${cid}] Store notification failed (might not be configured)`)
    }

    // Marcar como notificado independientemente del resultado
    await supabase
      .from('orders')
      .update({ 
        store_notified_at: new Date().toISOString(),
        notification_status: { push_sent: pushResult }
      })
      .eq('id', orderId)

  } catch (error) {
    console.error(`[webhooks:mercadopago][cid:${cid}] Failed to send store notification:`, error)
    // No fallar el webhook por problemas de notificaciones push
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

// Función para manejar webhooks de merchant_order (Checkout PRO)
async function handleMerchantOrderWebhook(
  request: Request,
  cid: string,
  merchantOrderId: string,
  storeSlug: string | null,
  storeId: string | null
) {
  const supabase = createAdminClient()

  const fail = (message: string, context?: unknown) => {
    console.error(`[webhooks:mercadopago][cid:${cid}] ${message}`, context)
    return NextResponse.json({ ok: true, cid })
  }

  // Obtener store_id si no se proporcionó
  let resolvedStoreId = storeId
  if (!resolvedStoreId && storeSlug) {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .single()
    
    resolvedStoreId = store?.id ?? null
  }

  if (!resolvedStoreId) {
    return fail("Unable to resolve store for merchant_order webhook", { merchantOrderId, storeSlug })
  }

  // Obtener credenciales de MercadoPago para consultar la merchant_order
  const { data: settings } = await supabase
    .from("store_settings")
    .select("mercadopago_access_token")
    .eq("store_id", resolvedStoreId)
    .single()

  if (!settings?.mercadopago_access_token) {
    return fail("Store missing MercadoPago credentials", { storeId: resolvedStoreId })
  }

  // Consultar la merchant_order desde MercadoPago
  console.log(`[webhooks:mercadopago][cid:${cid}] Fetching merchant_order ${merchantOrderId}`)
  
  const merchantOrderResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`, {
    headers: {
      Authorization: `Bearer ${settings.mercadopago_access_token}`,
    },
  })

  if (!merchantOrderResponse.ok) {
    return fail("Failed to fetch merchant_order from MercadoPago", { 
      status: merchantOrderResponse.status,
      merchantOrderId 
    })
  }

  const merchantOrder = await merchantOrderResponse.json()
  console.log(`[webhooks:mercadopago][cid:${cid}] Merchant Order data:`, merchantOrder)

  // Una merchant_order puede tener múltiples payments
  const payments = merchantOrder.payments || []
  
  if (payments.length === 0) {
    return fail("Merchant order has no payments", { merchantOrder })
  }

  // Procesar cada payment de la merchant_order
  for (const payment of payments) {
    const paymentId = payment.id
    if (!paymentId) continue

    console.log(`[webhooks:mercadopago][cid:${cid}] Processing payment ${paymentId} from merchant_order`)

    // Obtener detalles completos del payment
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${settings.mercadopago_access_token}`,
      },
    })

    if (!paymentResponse.ok) {
      console.error(`[webhooks:mercadopago][cid:${cid}] Failed to fetch payment ${paymentId}`)
      continue
    }

    const paymentDetail = await paymentResponse.json()
    
    // Buscar la checkout_session por external_reference
    const externalReference = paymentDetail.external_reference || merchantOrder.external_reference
    
    if (!externalReference) {
      console.error(`[webhooks:mercadopago][cid:${cid}] No external_reference found for payment ${paymentId}`)
      continue
    }

    console.log(`[webhooks:mercadopago][cid:${cid}] Looking for checkout_session with external_reference: ${externalReference}`)

    const { data: checkoutSession } = await supabase
      .from("checkout_sessions")
      .select("*")
      .eq("external_reference", externalReference)
      .eq("store_id", resolvedStoreId)
      .single()

    if (!checkoutSession) {
      console.error(`[webhooks:mercadopago][cid:${cid}] No checkout_session found for external_reference: ${externalReference}`)
      continue
    }

    // Solo procesar si el payment está approved
    if (paymentDetail.status !== "approved") {
      console.log(`[webhooks:mercadopago][cid:${cid}] Payment ${paymentId} not approved, status: ${paymentDetail.status}`)
      continue
    }

    let finalOrderId = checkoutSession.order_id

    // Crear la orden si no existe
    if (!checkoutSession.order_id) {
      console.log(`[webhooks:mercadopago][cid:${cid}] Creating order for approved payment ${paymentId}`)
      
      const orderData = checkoutSession.order_data as any
      const sessionItems = checkoutSession.items as any[]

      // Crear la orden
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          store_id: resolvedStoreId,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone,
          delivery_type: orderData.deliveryType,
          delivery_address: orderData.deliveryAddress,
          delivery_notes: orderData.deliveryNotes,
          subtotal: checkoutSession.subtotal ?? 0,
          delivery_fee: checkoutSession.delivery_fee ?? 0,
          total: checkoutSession.total ?? 0,
          status: "confirmed",
          payment_status: "completed",
          payment_id: String(paymentId),
        })
        .select("*, stores (slug)")
        .single()

      if (orderError || !order) {
        console.error(`[webhooks:mercadopago][cid:${cid}] Failed to create order:`, orderError)
        continue
      }

      finalOrderId = order.id

      // Crear order_items
      if (sessionItems.length > 0) {
        const orderItems = sessionItems.map((item: any) => ({
          order_id: order.id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          selected_options: item.selectedOptions ?? null,
        }))

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems)

        if (itemsError) {
          console.error(`[webhooks:mercadopago][cid:${cid}] Failed to create order items:`, itemsError)
        }
      }

      // Actualizar checkout_session con order_id
      await supabase
        .from("checkout_sessions")
        .update({
          order_id: order.id,
          status: "approved",
          payment_status: "completed",
          payment_id: String(paymentId),
          processed_at: new Date().toISOString(),
        })
        .eq("id", checkoutSession.id)

      console.log(`[webhooks:mercadopago][cid:${cid}] Order created successfully: ${order.id}`)

      // Enviar notificaciones
      try {
        await handlePaymentApprovedNotifications(order.id, resolvedStoreId, cid)
      } catch (error) {
        console.error(`[webhooks:mercadopago][cid:${cid}] Failed to send notifications:`, error)
      }
    }

    // Registrar el payment en la tabla payments
    const normalizedPaymentStatus = mapPaymentStatus(PROVIDER_KEY, paymentDetail.status)
    const normalizedOrderStatus = mapOrderStatus(PROVIDER_KEY, paymentDetail.status)

    const paymentRecord = {
      order_id: finalOrderId,
      store_id: resolvedStoreId,
      provider: PROVIDER_KEY,
      provider_payment_id: String(paymentId),
      preference_id: merchantOrder.preference_id ?? null,
      mp_payment_id: String(paymentId),
      payment_method: paymentDetail.payment_method_id ?? null,
      source_type: paymentDetail.payment_type_id ?? null,
      status: normalizedPaymentStatus,
      status_detail: paymentDetail.status_detail ?? null,
      transaction_amount: paymentDetail.transaction_amount,
      currency: paymentDetail.currency_id ?? "ARS",
      payer_email: paymentDetail.payer?.email ?? null,
      collector_id: paymentDetail.collector_id ? String(paymentDetail.collector_id) : null,
      metadata: paymentDetail.metadata ?? null,
      raw: paymentDetail,
    }

    const { error: upsertError } = await supabase
      .from("payments")
      .upsert(paymentRecord, {
        onConflict: "provider,provider_payment_id",
        ignoreDuplicates: false,
      })

    if (upsertError && !isIdempotentConflict(upsertError)) {
      console.error(`[webhooks:mercadopago][cid:${cid}] Failed to upsert payment:`, upsertError)
    } else {
      console.log(`[webhooks:mercadopago][cid:${cid}] Payment record upserted successfully`)
    }
  }

  return NextResponse.json({ ok: true, cid })
}