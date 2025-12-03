/**
 * Utilidades para el SDK de MercadoPago Subscriptions
 */

import { SubscriptionStatus } from "@/lib/types/subscription"

/**
 * Mapea el estado de MercadoPago al estado interno
 */
export function mapMercadoPagoStatus(mpStatus: string): SubscriptionStatus {
  const statusMap: Record<string, SubscriptionStatus> = {
    'pending': 'pending',        // 🔧 CORREGIDO: Pago no procesado
    'authorized': 'active',      // ✅ Pago confirmado, suscripción activa
    'paused': 'suspended',       // ✅ Pausada por el usuario
    'cancelled': 'cancelled',    // ✅ Cancelada por usuario o merchant
    'finished': 'expired'        // ✅ Terminada naturalmente
  }

  return statusMap[mpStatus] || 'cancelled'
}

/**
 * Verifica si una suscripción está activa (incluyendo trial)
 */
export function isSubscriptionActive(status: SubscriptionStatus, trialEndsAt?: string): boolean {
  if (status === 'active') return true
  
  if (status === 'trial' && trialEndsAt) {
    const trialEnd = new Date(trialEndsAt)
    const now = new Date()
    return now < trialEnd
  }
  
  return false
}

/**
 * Calcula los días restantes del trial
 */
export function getTrialDaysLeft(trialEndsAt?: string): number {
  if (!trialEndsAt) return 0
  
  const trialEnd = new Date(trialEndsAt)
  const now = new Date()
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Formatea el precio para mostrar
 */
export function formatPrice(price: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(price)
}

/**
 * Formatea la fecha de facturación
 */
export function formatBillingDate(date: string): string {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Genera un resumen de la suscripción para mostrar al usuario
 */
export function getSubscriptionSummary(subscription: any): {
  statusText: string
  isActive: boolean
  daysLeft?: number
  nextBilling?: string
  canUpgrade: boolean
  canCancel: boolean
} {
  const isActive = isSubscriptionActive(subscription.status, subscription.trial_ends_at)
  const daysLeft = subscription.status === 'trial' ? getTrialDaysLeft(subscription.trial_ends_at) : undefined
  
  let statusText = ''
  switch (subscription.status) {
    case 'trial':
      statusText = daysLeft ? `Período de prueba - ${daysLeft} días restantes` : 'Período de prueba expirado'
      break
    case 'pending':
      statusText = 'Pendiente de pago - Completar suscripción'
      break
    case 'active':
      statusText = 'Suscripción activa - Pago al día'
      break
    case 'suspended':
      statusText = 'Suscripción pausada'
      break
    case 'past_due':
      statusText = 'Suspendida - Pago vencido'
      break
    case 'cancelled':
      statusText = 'Suscripción cancelada'
      break
    case 'expired':
      statusText = 'Suscripción expirada'
      break
    default:
      statusText = 'Estado desconocido'
  }

  return {
    statusText,
    isActive,
    daysLeft,
    nextBilling: subscription.next_billing_date ? formatBillingDate(subscription.next_billing_date) : undefined,
    canUpgrade: isActive && subscription.status !== 'cancelled',
    canCancel: ['trial', 'active'].includes(subscription.status)
  }
}

/**
 * Valida los parámetros de creación de suscripción
 */
export function validateSubscriptionParams(params: {
  storeId?: string
  planId?: string
  payerEmail?: string
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!params.storeId) {
    errors.push('ID de tienda es requerido')
  }

  if (!params.planId) {
    errors.push('ID de plan es requerido')
  }

  if (!params.payerEmail) {
    errors.push('Email del pagador es requerido')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.payerEmail)) {
    errors.push('Email del pagador no es válido')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calcula el precio prorrateado según los días restantes del período
 */
export function calculateProratedPrice(fullPrice: number, daysUsed: number, totalDays: number): number {
  const remainingDays = totalDays - daysUsed
  const dailyRate = fullPrice / totalDays
  return Math.max(0, remainingDays * dailyRate)
}

/**
 * Genera configuración para Checkout Pro de MercadoPago
 */
export function generateCheckoutConfig(subscription: any) {
  return {
    theme: {
      elementsColor: '#009EE3',
      headerColor: '#009EE3'
    },
    locale: 'es-AR',
    flow: {
      redirect: 'approved',
      failure: 'pending',
      pending: 'approved'
    }
  }
}

/**
 * Constantes del SDK
 */
export const SUBSCRIPTION_CONSTANTS = {
  DEFAULT_TRIAL_DAYS: 15,
  SUPPORTED_CURRENCIES: ['ARS', 'USD'],
  BILLING_FREQUENCIES: ['monthly', 'yearly'] as const,
  MAX_PLAN_NAME_LENGTH: 100,
  MAX_FEATURES_COUNT: 20
} as const

/**
 * Tipos de error específicos del SDK
 */
export enum SubscriptionErrorType {
  INVALID_PARAMS = 'INVALID_PARAMS',
  SUBSCRIPTION_EXISTS = 'SUBSCRIPTION_EXISTS',
  PLAN_NOT_FOUND = 'PLAN_NOT_FOUND',
  MERCADOPAGO_ERROR = 'MERCADOPAGO_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Maneja errores del SDK y los convierte a mensajes amigables
 */
export function handleSubscriptionError(error: any): {
  type: SubscriptionErrorType
  message: string
  userMessage: string
} {
  const errorMessage = error?.message || error || 'Error desconocido'
  
  if (errorMessage.includes('ya tiene una suscripción')) {
    return {
      type: SubscriptionErrorType.SUBSCRIPTION_EXISTS,
      message: errorMessage,
      userMessage: 'Ya tienes una suscripción activa. Cancela la actual antes de crear una nueva.'
    }
  }
  
  if (errorMessage.includes('no encontrado')) {
    return {
      type: SubscriptionErrorType.PLAN_NOT_FOUND,
      message: errorMessage,
      userMessage: 'El plan seleccionado no está disponible. Por favor, elige otro plan.'
    }
  }
  
  if (errorMessage.includes('MercadoPago')) {
    return {
      type: SubscriptionErrorType.MERCADOPAGO_ERROR,
      message: errorMessage,
      userMessage: 'Error en el procesamiento del pago. Verifica tus datos e intenta nuevamente.'
    }
  }
  
  if (errorMessage.includes('email') || errorMessage.includes('requerido')) {
    return {
      type: SubscriptionErrorType.INVALID_PARAMS,
      message: errorMessage,
      userMessage: 'Por favor, completa todos los campos requeridos correctamente.'
    }
  }
  
  return {
    type: SubscriptionErrorType.UNKNOWN_ERROR,
    message: errorMessage,
    userMessage: 'Ocurrió un error inesperado. Por favor, intenta nuevamente o contacta soporte.'
  }
}
