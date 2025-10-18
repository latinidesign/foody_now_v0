import type { PaymentStatus, OrderStatus } from "@/lib/types/database"

const MERCADOPAGO_PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  approved: "completed",
  accredited: "completed",
  in_process: "pending",
  pending: "pending",
  authorized: "pending",
  in_mediation: "pending",
  rejected: "failed",
  cancelled: "failed",
  charged_back: "refunded",
  refunded: "refunded",
}

const MERCADOPAGO_ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  approved: "confirmed",
  accredited: "confirmed",
  rejected: "cancelled",
  cancelled: "cancelled",
}

export function mapMercadoPagoPaymentStatus(status?: string | null): PaymentStatus {
  if (!status) {
    return "pending"
  }

  return MERCADOPAGO_PAYMENT_STATUS_MAP[status] ?? "pending"
}

export function mapMercadoPagoOrderStatus(status?: string | null): OrderStatus | null {
  if (!status) {
    return null
  }

  return MERCADOPAGO_ORDER_STATUS_MAP[status] ?? null
}

export function mapPaymentStatus(provider: string, status?: string | null): PaymentStatus {
  switch (provider) {
    case "mercadopago":
      return mapMercadoPagoPaymentStatus(status)
    default:
      return "pending"
  }
}

export function mapOrderStatus(provider: string, status?: string | null): OrderStatus | null {
  switch (provider) {
    case "mercadopago":
      return mapMercadoPagoOrderStatus(status)
    default:
      return null
  }
}
