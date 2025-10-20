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

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestPayload),
    })

    const body = (await response.json().catch(() => ({}))) as Record<string, unknown>

    if (!response.ok || !body?.id) {
      throw new PaymentProviderError("Mercado Pago rejected the payment", {
        status: response.status,
        details: body,
      })
    }

    return {
      id: String(body.id),
      status: body.status,
      status_detail: body.status_detail,
      transaction_amount: body.transaction_amount,
      currency_id: body.currency_id,
      payment_method_id: body.payment_method_id,
      collector_id: body.collector_id,
      payer_email: body.payer?.email ?? payer.email ?? order.customer_email ?? null,
      raw: body,
    }
  }
}

export const mercadoPagoProvider = new MercadoPagoProvider()
