import { mercadoPagoProvider } from "./providers/mercadopago"
import type { PaymentProvider, PaymentProviderKey } from "./types"

const PROVIDERS: Record<PaymentProviderKey, PaymentProvider> = {
  mercadopago: mercadoPagoProvider,
}

export function getPaymentProvider(key: string): PaymentProvider | null {
  if (key in PROVIDERS) {
    return PROVIDERS[key as PaymentProviderKey]
  }

  return null
}

export * from "./types"
export * from "./status"
