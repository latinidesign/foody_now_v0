import { randomUUID } from "crypto"

import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getSubdomainFromHost } from "@/lib/tenant"
import {
  PaymentProviderError,
  getPaymentProvider,
  mapOrderStatus,
  mapPaymentStatus,
  type PaymentSource,
  type PaymentPayer,
} from "@/lib/payments"

export const runtime = "nodejs"

type ChargePaymentPayload = {
  order_id?: string
  provider?: string
  payment_source?: unknown
  payer?: Partial<PaymentPayer>
  description?: string
  currency?: string
  metadata?: unknown
}

function normalizeInstallments(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function POST(request: Request) {
  const cid = randomUUID()

  const fail = (status: number, message: string, context?: unknown) => {
    console.error(`[payments:charge][cid:${cid}] ${message}`, context)
    return NextResponse.json({ error: message, cid }, { status })
  }

  let payload: ChargePaymentPayload

  try {
    payload = (await request.json()) as ChargePaymentPayload
  } catch (error) {
    return fail(400, "Invalid JSON payload", error)
  }

  const orderId = payload?.order_id

  if (!orderId) {
    return fail(400, "Missing order_id in payload")
  }

  const providerKey = (payload?.provider ?? "mercadopago").toLowerCase()
  const provider = getPaymentProvider(providerKey)

  if (!provider) {
    return fail(400, `Unsupported payment provider: ${providerKey}`)
  }

  const paymentSourcePayload = payload?.payment_source

  if (!isRecord(paymentSourcePayload)) {
    return fail(400, "Missing payment_source information")
  }

  if (!("type" in paymentSourcePayload) || typeof paymentSourcePayload.type !== "string") {
    return fail(400, "payment_source.type is required")
  }

  const sourceType = paymentSourcePayload.type.toLowerCase()

  let paymentSource: PaymentSource

  if (sourceType === "card") {
    const token = "token" in paymentSourcePayload && typeof paymentSourcePayload.token === "string"
      ? paymentSourcePayload.token.trim()
      : ""

    if (!token) {
      return fail(400, "Card payments require a token generated on the client")
    }

    const installments = normalizeInstallments((paymentSourcePayload as Record<string, unknown>).installments)

    paymentSource = {
      type: "card",
      token,
      payment_method_id:
        typeof paymentSourcePayload.payment_method_id === "string"
          ? paymentSourcePayload.payment_method_id.trim() || undefined
          : undefined,
      issuer_id:
        typeof paymentSourcePayload.issuer_id === "string"
          ? paymentSourcePayload.issuer_id.trim() || undefined
          : undefined,
      installments,
    }
  } else if (sourceType === "wallet") {
    const walletId = "wallet_id" in paymentSourcePayload && typeof paymentSourcePayload.wallet_id === "string"
      ? paymentSourcePayload.wallet_id.trim()
      : ""

    if (!walletId) {
      return fail(400, "Wallet payments require a wallet_id identifier")
    }

    paymentSource = {
      type: "wallet",
      wallet_id: walletId,
    }
  } else {
    return fail(400, `Unsupported payment_source.type: ${paymentSourcePayload.type}`)
  }

  const supabase = createAdminClient()

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, store_id, total, status, payment_status, customer_email")
    .eq("id", orderId)
    .single()

  if (orderError || !order) {
    return fail(404, "Order not found", orderError)
  }

  if (order.payment_status && order.payment_status !== "pending") {
    return fail(409, "Order is already processed")
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, slug, name, is_active")
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

  const { data: storeSettings, error: settingsError } = await supabase
    .from("store_settings")
    .select("mercadopago_access_token, mercadopago_public_key")
    .eq("store_id", store.id)
    .single()

  if (settingsError) {
    return fail(500, "Unable to load store payment configuration", settingsError)
  }

  const payer: PaymentPayer = {
    email: payload?.payer?.email ?? order.customer_email ?? "",
    first_name: payload?.payer?.first_name,
    last_name: payload?.payer?.last_name,
    identification: payload?.payer?.identification,
  }

  if (!payer.email) {
    return fail(400, "Payer email is required to process the payment")
  }

  const description = payload?.description ?? `Orden ${order.id}`
  const metadata = isRecord(payload?.metadata) ? (payload.metadata as Record<string, unknown>) : undefined

  try {
    const result = await provider.charge({
      order: {
        id: order.id,
        store_id: order.store_id,
        total: Number(order.total),
        customer_email: order.customer_email,
      },
      store: {
        id: store.id,
        slug: store.slug,
        name: store.name,
      },
      storeSettings: storeSettings ?? {},
      payer,
      source: paymentSource,
      description,
      metadata: {
        ...(metadata ?? {}),
        subdomain: subdomain ?? null,
      },
      currency: payload?.currency ?? "ARS",
    })

    const normalizedPaymentStatus = mapPaymentStatus(providerKey, result.status)
    const normalizedOrderStatus = mapOrderStatus(providerKey, result.status)

    const paymentRecord = {
      order_id: order.id,
      store_id: store.id,
      provider: providerKey,
      provider_payment_id: result.id,
      mp_payment_id: providerKey === "mercadopago" ? result.id : null,
      payment_method:
        paymentSource.type === "card"
          ? paymentSource.payment_method_id ?? result.payment_method_id ?? null
          : result.payment_method_id ?? null,
      status: result.status,
      status_detail: result.status_detail ?? null,
      transaction_amount: result.transaction_amount ?? Number(order.total),
      currency: result.currency_id ?? payload?.currency ?? "ARS",
      payer_email: result.payer_email ?? payer.email ?? order.customer_email ?? null,
      collector_id: result.collector_id ? String(result.collector_id) : null,
      source_type: paymentSource.type,
      metadata: metadata ?? null,
      raw: result.raw,
    }

    const { error: upsertError } = await supabase
      .from("payments")
      .upsert(paymentRecord, { onConflict: "provider,provider_payment_id" })

    if (upsertError) {
      console.error(`[payments:charge][cid:${cid}] Unable to persist payment`, upsertError)
    }

    const orderUpdates: Record<string, unknown> = {
      payment_status: normalizedPaymentStatus,
      payment_id: result.id,
    }

    if (normalizedOrderStatus) {
      orderUpdates.status = normalizedOrderStatus
    }

    const { error: orderUpdateError } = await supabase.from("orders").update(orderUpdates).eq("id", order.id)

    if (orderUpdateError) {
      console.error(`[payments:charge][cid:${cid}] Unable to update order status`, orderUpdateError)
    }

    return NextResponse.json(
      {
        payment_id: result.id,
        status: result.status,
        status_detail: result.status_detail ?? null,
        payment_status: normalizedPaymentStatus,
        order_status: normalizedOrderStatus,
        cid,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof PaymentProviderError) {
      return fail(error.status && error.status >= 400 ? error.status : 502, error.message, error.details)
    }

    return fail(500, "Unexpected error processing payment", error)
  }
}
