export const MERCADOPAGO_PAYMENT_METHOD_LABELS: Record<string, string> = {
  account_money: "Saldo MercadoPago",
  visa: "Visa",
  master: "MasterCard",
  american_express: "American Express",
  diners: "Diners Club",
  elo: "Elo",
  hipercard: "Hipercard",
  rapipago: "Rapipago",
  pagofacil: "Pago Fácil",
  debito_automatico: "Débito automático",
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  prepaid_card: "Tarjeta prepaga",
  mercadopago: "MercadoPago",
  ticket: "Efectivo (Ticket)",
}

export function getPaymentMethodLabel(provider: string, methodId: string | null): string {
  if (!methodId) return "Desconocido"
  
  if (provider === "mercadopago") {
    return MERCADOPAGO_PAYMENT_METHOD_LABELS[methodId] || methodId
  }
  
  return methodId
}
