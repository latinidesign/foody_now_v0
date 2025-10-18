export type PaymentProviderKey = "mercadopago"

export interface PaymentPayer {
  email: string
  first_name?: string
  last_name?: string
  identification?: {
    type?: string
    number?: string
  }
}

export type CardPaymentSource = {
  type: "card"
  token: string
  payment_method_id?: string
  issuer_id?: string
  installments?: number
}

export type WalletPaymentSource = {
  type: "wallet"
  wallet_id: string
}

export type PaymentSource = CardPaymentSource | WalletPaymentSource

export interface PaymentProviderChargeParams {
  order: {
    id: string
    store_id: string
    total: number
    customer_email?: string | null
  }
  store: {
    id: string
    slug: string
    name?: string | null
  }
  storeSettings: {
    mercadopago_access_token?: string | null
    mercadopago_public_key?: string | null
    [key: string]: unknown
  }
  payer: PaymentPayer
  source: PaymentSource
  description?: string
  metadata?: Record<string, unknown>
  currency?: string
}

export interface PaymentChargeResult {
  id: string
  status: string
  status_detail?: string
  transaction_amount?: number
  currency_id?: string
  payment_method_id?: string
  collector_id?: string | number
  payer_email?: string | null
  raw: Record<string, unknown>
}

export interface PaymentProvider {
  charge(params: PaymentProviderChargeParams): Promise<PaymentChargeResult>
}

export class PaymentProviderError extends Error {
  status?: number
  details?: unknown

  constructor(message: string, options?: { status?: number; details?: unknown }) {
    super(message)
    this.name = "PaymentProviderError"
    this.status = options?.status
    this.details = options?.details
  }
}
