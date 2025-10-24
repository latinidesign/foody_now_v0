import { randomUUID } from "crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { getSubdomainFromHost } from "@/lib/tenant"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type CreatePreferencePayload = {
  order_id?: string
  orderId?: string
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

  const { data: storeSettings, error: storeSettingsError } = await supabase
    .from("store_settings")
    .select("mercadopago_access_token, mercadopago_public_key")
    .eq("store_id", store.id)
    .single()

  if (storeSettingsError) {
    return fail(500, "Unable to load store payment configuration", storeSettingsError)
  }

  if (!storeSettings?.mercadopago_access_token) {
    return fail(400, "Store is missing Mercado Pago credentials")
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

  const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL

  if (!baseUrl) {
    return fail(500, "APP_BASE_URL environment variable is not configured")
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "")
  const notificationUrl = new URL(`${normalizedBaseUrl}/api/webhooks/mercadopago`)
  notificationUrl.searchParams.set("store_id", store.id)
  notificationUrl.searchParams.set("store_slug", store.slug)

  const externalReference = randomUUID()

  const { data: checkoutSession, error: sessionError } = await supabase
    .from("checkout_sessions")
    .insert({
      store_id: store.id,
      items: orderItems,
      order_data: {
        id: order.id,
        store_id: order.store_id,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
        payment_status: order.payment_status,
      },
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
      external_reference: externalReference,
      status: "pending",
      payment_status: "pending",
    })
    .select()
    .single()

  if (sessionError || !checkoutSession) {
    return fail(500, "No se pudo iniciar el pago", sessionError)
  }

  // Build tenant root URL (tenant subdomain) so back_urls redirect to the store home
  let tenantBase: string
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL)
    tenantBase = `${appUrl.protocol}//${store.slug}.${appUrl.hostname}`
  } else {
    // fallback to request host-derived base (assume host like tenant.example.com)
    const hostHeader = request.headers.get("host") ?? `${store.slug}.localhost`
    const hostParts = hostHeader.split(":")[0]
    tenantBase = `https://${hostParts.split(".").slice(-2).join(".")}`
    tenantBase = tenantBase.replace("//", `//${store.slug}.`)
  }

  const preferenceData = {
    items: orderItems.map((item: any) => ({
      id: item.id,
      title: item.products?.name ?? "Producto",
      quantity: item.quantity,
      unit_price: item.unit_price,
      currency_id: "ARS",
    })),
    external_reference: order.id,
    auto_return: "approved",
    back_urls: {
      success: `${tenantBase}/?session_id=${checkoutSession.id}`,
      pending: `${tenantBase}/?session_id=${checkoutSession.id}`,
      failure: `${tenantBase}/?session_id=${checkoutSession.id}`,
    },
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook?tenant=${store.slug}`,
    metadata: {
      checkout_session_id: checkoutSession.id,
      store_slug: store.slug,
      subdomain: subdomain ?? null,
    },
  }

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${storeSettings.mercadopago_access_token}`,
    },
    body: JSON.stringify(preferenceData),
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
