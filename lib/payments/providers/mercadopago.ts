import { PaymentProvider, PaymentProviderChargeParams, PaymentChargeResult, PaymentProviderError } from "../types"

function cleanObject<T extends Record<string, unknown>>(value: T): T {
  const result: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(value)) {
    if (val !== undefined && val !== null) {
      result[key] = val
    }
  }

  return result as T
}

// Add Mercado Pago response types so TypeScript knows the shape of the parsed JSON
interface MercadoPagoPayer {
  email?: string | null
  first_name?: string | null
  last_name?: string | null
  identification?: { type?: string; number?: string } | null
}

interface MercadoPagoPaymentResponse {
  id?: string | number
  status?: string
  status_detail?: string
  transaction_amount?: number
  currency_id?: string
  payment_method_id?: string
  collector_id?: number
  payer?: MercadoPagoPayer | null
  [key: string]: unknown
}

export class MercadoPagoProvider implements PaymentProvider {
  async charge(params: PaymentProviderChargeParams): Promise<PaymentChargeResult> {
    const { order, store, storeSettings, payer, source, description, metadata } = params

    if (source.type !== "card") {
      throw new PaymentProviderError("Mercado Pago currently supports card tokens for direct charges", { status: 400 })
    }

    const accessToken = storeSettings.mercadopago_access_token

    if (!accessToken) {
      throw new PaymentProviderError("Store is missing Mercado Pago access token", { status: 400 })
    }

    if (!source.token) {
      throw new PaymentProviderError("Missing card token for Mercado Pago payment", { status: 400 })
    }

    // If raw card fields are present on the source, validate and normalize them
    // (some frontends may send card fields instead of a token). This does not
    // replace token-based flows, but helps catch malformed requests early.
    const cardData = (source as any).card ?? (source as any)
    const expMonthRaw = cardData.expiration_month ?? cardData.expiry_month ?? cardData.month ?? undefined
    const expYearRaw = cardData.expiration_year ?? cardData.expiry_year ?? cardData.year ?? undefined

    if (expMonthRaw || expYearRaw) {
      if (!expMonthRaw) throw new PaymentProviderError('Missing expiration_month', { status: 400 })
      const expMonth = Number(expMonthRaw)
      if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12) throw new PaymentProviderError('Invalid expiration_month', { status: 400 })

      if (!expYearRaw) throw new PaymentProviderError('Missing expiration_year', { status: 400 })
      let expYearStr = String(expYearRaw).trim()
      if (expYearStr.length === 4) expYearStr = expYearStr.slice(-2) // 2028 -> "28"
      if (expYearStr.length !== 2) throw new PaymentProviderError('Invalid expiration_year format', { status: 400 })

      // Normalized values (not added to requestPayload when using tokens).
      const expiration_month = expMonth
      const expiration_year = expYearStr
      // If you ever send raw card data to Mercado Pago, include these fields.
    }

    const requestPayload = cleanObject({
      transaction_amount: Number(order.total),
      token: source.token,
      installments: source.installments ?? 1,
      payment_method_id: source.payment_method_id,
      issuer_id: source.issuer_id,
      description: description ?? `Orden ${order.id}`,
      external_reference: order.id,
      metadata: {
        ...(metadata ?? {}),
        order_id: order.id,
        store_id: store.id,
        store_slug: store.slug,
      },
      payer: cleanObject({
        email: payer.email ?? order.customer_email ?? undefined,
        first_name: payer.first_name,
        last_name: payer.last_name,
        identification: payer.identification,
      }),
      binary_mode: true,
      statement_descriptor: store.name?.slice(0, 22),
      additional_info: {
        items: [
          {
            id: order.id,
            title: description ?? `Orden ${order.id}`,
            quantity: 1,
            unit_price: Number(order.total),
          },
        ],
      },
    })

    // Build an idempotency key: prefer a UUID from global crypto if available, otherwise fall back
    const idempotencyKey = typeof globalThis?.crypto?.randomUUID === "function"
      ? (globalThis.crypto as any).randomUUID()
      : `${new Date().toISOString()};${order.id};${Math.random().toString(36).slice(2,9)}`

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(requestPayload),
    })

    const body = (await response.json().catch(() => ({}))) as MercadoPagoPaymentResponse

    if (!response.ok || !body?.id) {
      throw new PaymentProviderError("Mercado Pago rejected the payment", {
        status: response.status,
        details: body,
      })
    }

    return {
      id: String(body.id),
      status: String(body.status ?? "unknown"),
      status_detail: body.status_detail ?? undefined,
      transaction_amount: (typeof body.transaction_amount === "number" ? body.transaction_amount : undefined),
      currency_id: typeof body.currency_id === "string" ? body.currency_id : undefined,
      payment_method_id: typeof body.payment_method_id === "string" ? body.payment_method_id : undefined,
      collector_id: typeof body.collector_id === "number" || typeof body.collector_id === "string" ? body.collector_id : undefined,
      payer_email: body.payer?.email ?? payer.email ?? order.customer_email ?? null,
      raw: body as Record<string, unknown>,
    }
  }
}

export const mercadoPagoProvider = new MercadoPagoProvider()
