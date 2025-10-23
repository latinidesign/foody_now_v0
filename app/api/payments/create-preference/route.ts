import { randomUUID } from "crypto"

import { getTenantSlugFromHost } from "@/lib/tenant"
import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const cid = randomUUID()

  const fail = (status: number, message: string, context?: unknown) => {
    console.error(`[payments:create-preference][cid:${cid}] ${message}`, context)
    return NextResponse.json({ error: message, cid }, { status })
  }

  let body: any
  try {
    body = await request.json()
  } catch (parseError) {
    return fail(400, "Payload inválido", parseError)
  }

  const { storeId, items, orderData, subtotal, deliveryFee, total } = body ?? {}

  if (!Array.isArray(items) || items.length === 0) {
    return fail(400, "Items inválidos")
  }

  if (!orderData?.customerEmail || !orderData?.customerName) {
    return fail(400, "Datos del cliente incompletos")
  }

  const tenantSlug = getTenantSlugFromHost(request.headers.get("host"))

  if (!tenantSlug) {
    return fail(400, "No se pudo determinar la tienda desde el dominio")
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

  if (storeId && storeId !== store.id) {
    return fail(403, "El identificador de la tienda no coincide con el dominio")
  }

  const { data: storeSettings, error: storeSettingsError } = await supabase
    .from("store_settings")
    .select("mercadopago_access_token")
    .eq("store_id", store.id)
    .single()

  if (storeSettingsError) {
    return fail(500, "No se pudo obtener la configuración de pagos", storeSettingsError)
  }

  if (!storeSettings?.mercadopago_access_token) {
    return fail(400, "MercadoPago no configurado para la tienda")
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return fail(500, "NEXT_PUBLIC_APP_URL no está configurado")
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
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/success?session_id=${checkoutSession.id}`,
      failure: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/failure?session_id=${checkoutSession.id}`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/store/payment/pending?session_id=${checkoutSession.id}`,
    },
    auto_return: "approved",
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook?tenant=${tenantSlug}`,
    external_reference: externalReference,
    statement_descriptor: "FOODY NOW",
    metadata: {
      checkout_session_id: checkoutSession.id,
      store_slug: tenantSlug,
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

  if (!response.ok) {
    let errorData: unknown

    try {
      errorData = await response.json()
    } catch (responseParseError) {
      console.error(
        `[payments:create-preference][cid:${cid}] Falló el parseo del error de MercadoPago`,
        responseParseError,
      )
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
    console.error(
      `[payments:create-preference][cid:${cid}] No se pudo actualizar la sesión de checkout`,
      updateSessionError,
    )
  }

  return NextResponse.json({
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sessionId: checkoutSession.id,
  })
}
