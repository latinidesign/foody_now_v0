import { randomUUID } from "crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { getSubdomainFromHost } from "@/lib/tenant"
import { NextResponse } from "next/server"
import { getValidAccessToken } from "@/lib/mercadopago/SellerUtils"


export const runtime = "nodejs"

type CreatePreferencePayload = {
  order_id?: string
  orderId?: string
  // OR checkout session payload
  storeId?: string
  items?: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
  orderData?: {
    customerName: string
    customerPhone: string
    customerEmail: string
    deliveryType: "pickup" | "delivery"
    deliveryAddress: string
    deliveryNotes: string
  }
  subtotal?: number
  deliveryFee?: number
  total?: number
}

export async function POST(request: Request) {
  const cid = randomUUID()

  const fail = (status: number, message: string, context?: unknown) => {
    console.error(`[payments:create-preference][cid:${cid}] ${message}`, context)
    return NextResponse.json({ error: message, cid }, { status })
  }

  let body: CreatePreferencePayload | undefined

  try {
    body = (await request.json()) as CreatePreferencePayload
  } catch (error) {
    return fail(400, "Invalid JSON payload", error)
  }

  const orderId = body?.order_id ?? body?.orderId

  // Handle checkout session payload (cart direct checkout)
  if (!orderId && body?.storeId && body?.items && body?.orderData) {
    return handleCheckoutSession(request, body, cid, fail)
  }

  // Handle existing order payload
  if (!orderId) {
    return fail(400, "Missing order_id in payload")
  }

  const supabase = createAdminClient()

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, store_id, subtotal, delivery_fee, total, payment_status")
    .eq("id", orderId)
    .single()

  if (orderError || !order) {
    return fail(404, "Order not found", orderError)
  }

  if (order.payment_status && order.payment_status !== "pending") {
    return fail(409, "Order already processed")
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, slug, is_active")
    .eq("id", order.store_id)
    .single()

  if (storeError || !store) {
    return fail(404, "Store not found", storeError)
  }

  if (!store.is_active) {
    return fail(403, "Store is not active")
  }

  const host = request.headers.get("host")
  const subdomain = getSubdomainFromHost(host)

  if (subdomain && subdomain !== store.slug) {
    return fail(403, "Store domain does not match order store")
  }

  let accessToken: string

  try {
    accessToken = await getValidAccessToken(store.id)
  } catch (tokenError) {
    return fail(500, "No se pudo obtener token válido de MercadoPago", tokenError)
  }


  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("quantity, unit_price, products(name)")
    .eq("order_id", order.id)

  if (itemsError) {
    return fail(500, "Unable to load order items", itemsError)
  }

  if (!orderItems?.length) {
    return fail(400, "Order has no items")
  }

  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL

  if (!baseUrl) {
    return fail(500, "APP_URL environment variable is not configured")
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "")
  const notificationUrl = new URL(`${normalizedBaseUrl}/api/webhook/mercadopago`)
  notificationUrl.searchParams.set("store_id", store.id)
  notificationUrl.searchParams.set("store_slug", store.slug)

  const preferencePayload = {
    items: orderItems.map((item) => ({
      title: item.products?.[0]?.name ?? "Producto",
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "ARS",
    })),
    external_reference: order.id,
    auto_return: "approved",
    back_urls: {
      success: `${normalizedBaseUrl}/store/payment/success?order_id=${order.id}`,
      pending: `${normalizedBaseUrl}/store/payment/pending?order_id=${order.id}`,
      failure: `${normalizedBaseUrl}/store/payment/failure?order_id=${order.id}`,
    },
    notification_url: notificationUrl.toString(),
    metadata: {
      store_id: store.id,
      order_id: order.id,
      subdomain: subdomain ?? null,
    },
  }

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(preferencePayload),
  })

  const preference = await response.json().catch(() => null)

  if (!response.ok || !preference?.id || !preference?.init_point) {
    console.error(
      `[payments:create-preference][cid:${cid}] Mercado Pago preference creation failed`,
      { status: response.status, body: preference },
    )
    return fail(502, "Mercado Pago returned an error", preference)
  }

  const paymentRecord = {
    order_id: order.id,
    store_id: store.id,
    preference_id: preference.id,
    status: "awaiting_payment",
    raw: preference,
  }

  const { error: paymentInsertError } = await supabase.from("payments").insert(paymentRecord)

  if (paymentInsertError) {
    console.error(
      `[payments:create-preference][cid:${cid}] Unable to persist payment preference`,
      paymentInsertError,
    )
  }

  return NextResponse.json({ preference_id: preference.id, init_point: preference.init_point, cid })
}

async function handleCheckoutSession(
  request: Request,
  body: CreatePreferencePayload,
  cid: string,
  fail: (status: number, message: string, context?: unknown) => Response
) {
  const { storeId, items, orderData, subtotal, deliveryFee, total } = body

  if (!Array.isArray(items) || items.length === 0) {
    return fail(400, "Items inválidos")
  }

  if (!orderData?.customerEmail || !orderData?.customerName) {
    return fail(400, "Datos del cliente incompletos")
  }

  const supabase = createAdminClient()

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, slug, is_active")
    .eq("id", storeId)
    .single()

  if (storeError || !store) {
    return fail(404, "Tienda no encontrada", storeError)
  }

  if (!store.is_active) {
    return fail(403, "La tienda no está activa")
  }

  const { data: mpAccount, error: mpAccountError } = await supabase
    .from("mp_accounts")
    .select("access_token")
    .eq("store_id", store.id)
    .single()

  if (mpAccountError) {
    return fail(500, "No se pudo obtener la configuración de pagos", mpAccountError)
  }

  if (!mpAccount?.access_token) {
    return fail(400, "MercadoPago no configurado para la tienda")
  }

  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    return fail(500, "APP_URL no está configurado")
  }

  const externalReference = randomUUID()

  const { data: checkoutSession, error: sessionError } = await supabase
    .from("checkout_sessions")
    .insert({
      store_id: store.id,
      items,
      order_data: orderData,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      external_reference: externalReference,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single()

  if (sessionError || !checkoutSession) {
    return fail(500, "No se pudo iniciar el pago", sessionError)
  }

  // Build tenant root URL
  // Build tenant root URL usando path en vez de subdominio
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "")
  const tenantBase = `${normalizedBaseUrl}/store/${store.slug}`

  const preferenceData = {
    items: items.map((item: any) => ({
      id: item.id,
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: "ARS",
    })),
    payer: {
      name: orderData.customerName,
      email: orderData.customerEmail,
      phone: {
        number: orderData.customerPhone,
      },
    },
    application_fee: 0,
    back_urls: {
      success: `${tenantBase}/?session_id=${checkoutSession.id}`,
      failure: `${tenantBase}/?session_id=${checkoutSession.id}`,
      pending: `${tenantBase}/?session_id=${checkoutSession.id}`,
    },
    auto_return: "approved",
    notification_url: `${normalizedBaseUrl}/api/webhook/mercadopago?store_slug=${store.slug}`,
    external_reference: externalReference,
    statement_descriptor: "FOODY NOW",
    metadata: {
      checkout_session_id: checkoutSession.id,
      store_slug: store.slug,
    },
  }

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${mpAccount.access_token}`,
      "X-Idempotency-Key": `${Date.now()}-${externalReference}`,
    },
    body: JSON.stringify(preferenceData),
  })

  if (!response.ok) {
    let errorData: unknown
    try {
      errorData = await response.json()
    } catch (responseParseError) {
      console.error(`[payments:create-preference][cid:${cid}] Falló el parseo del error de MercadoPago`, responseParseError)
    }

    await supabase
      .from("checkout_sessions")
      .update({
        status: "failed",
        payment_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", checkoutSession.id)

    return fail(502, "Error al crear preferencia de pago", errorData)
  }

  const preference = await response.json()

  const { error: updateSessionError } = await supabase
    .from("checkout_sessions")
    .update({
      preference_id: preference.id,
      preference_payload: preferenceData,
      init_point: preference.init_point,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutSession.id)

  if (updateSessionError) {
    console.error(`[payments:create-preference][cid:${cid}] No se pudo actualizar la sesión de checkout`, updateSessionError)
  }

  return NextResponse.json({
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sessionId: checkoutSession.id,
  })
}
