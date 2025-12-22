/**
 * Configuración centralizada de planes de MercadoPago
 * 
 * Este archivo define los dos planes de suscripción:
 * 1. Plan con trial (7 días) - Para usuarios nuevos
 * 2. Plan sin trial - Para renovaciones (expired, cancelled, suspended)
 */

export const MERCADOPAGO_PLANS = {
  /**
   * Plan para usuarios que NUNCA han usado trial
   * - Primera suscripción
   * - Estado: sin suscripción previa o solo 'pending'
   */
  WITH_TRIAL: {
    id: process.env.NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID || '', // ⚠️ Configurar en .env
    name: 'Suscripción Mensual con Trial',
    description: '14 días de prueba gratuita + Renovación mensual',
    trial_days: 14,
    price: 36000,
    currency: 'ARS',
    frequency: 1,
    frequency_type: 'months',
  },
  
  /**
   * Plan para usuarios que YA usaron trial
   * - Renovaciones después de: expired, cancelled, suspended, past_due
   * - Sin período de prueba, pago inmediato
   */
  WITHOUT_TRIAL: {
    id: '946bf6e3186741b5b7b8accbbdf646a5', // ✅ Ya creado en MP
    name: 'Suscripción Mensual (Renovación)',
    description: 'Renovación mensual sin período de prueba',
    trial_days: 0,
    price: 36000,
    currency: 'ARS',
    frequency: 1,
    frequency_type: 'months',
  }
} as const

export type PlanType = 'WITH_TRIAL' | 'WITHOUT_TRIAL'

/**
 * Estados de suscripción que indican que el usuario YA usó trial
 */
export const STATES_WITH_TRIAL_USED = [
  'trial',
  'active', 
  'expired',
  'cancelled',
  'suspended',
  'past_due'
] as const

/**
 * Obtiene el ID del plan de MercadoPago según el tipo
 * @param planType - Tipo de plan: con o sin trial
 * @returns Plan ID para usar en la URL de checkout
 */
export function getMercadoPagoPlanId(planType: PlanType): string {
  const planId = MERCADOPAGO_PLANS[planType].id
  
  if (!planId) {
    throw new Error(
      `Plan ${planType} no configurado. ` +
      'Verificá la variable de entorno NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID'
    )
  }
  
  return planId
}

/**
 * Determina qué tipo de plan usar según el historial de suscripciones
 * @param hasUsedTrial - Si la tienda ya tuvo alguna suscripción autorizada
 * @returns Tipo de plan a usar
 */
export function getPlanTypeByHistory(hasUsedTrial: boolean): PlanType {
  return hasUsedTrial ? 'WITHOUT_TRIAL' : 'WITH_TRIAL'
}

/**
 * Genera la URL completa de checkout de MercadoPago
 * @param planType - Tipo de plan
 * @param backUrl - URL de retorno después del pago
 * @returns URL completa del checkout
 */
export function generateCheckoutUrl(
  planType: PlanType,
  backUrl: string
): string {
  const planId = getMercadoPagoPlanId(planType)
  const encodedBackUrl = encodeURIComponent(backUrl)
  
  return `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}&back_url=${encodedBackUrl}`
}

/**
 * Obtiene el número de días de trial según el tipo de plan
 * @param planType - Tipo de plan
 * @returns Días de trial (0 si no tiene)
 */
export function getTrialDays(planType: PlanType): number {
  return MERCADOPAGO_PLANS[planType].trial_days
}

/**
 * Validación: verifica que todos los planes estén configurados
 * Lanzar en el inicio de la aplicación para detectar errores de configuración
 */
export function validatePlanConfiguration(): void {
  const errors: string[] = []
  
  if (!MERCADOPAGO_PLANS.WITH_TRIAL.id) {
    errors.push(
      'NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID no está configurado en .env'
    )
  }
  
  if (!MERCADOPAGO_PLANS.WITHOUT_TRIAL.id) {
    errors.push(
      'Plan sin trial no configurado (debería ser 946bf6e3186741b5b7b8accbbdf646a5)'
    )
  }
  
  if (errors.length > 0) {
    throw new Error(
      '❌ Configuración de planes incompleta:\n' + errors.join('\n')
    )
  }
  
  console.log('✅ Planes de MercadoPago configurados correctamente')
}

// Ejemplo de uso:
// 
// import { getPlanTypeByHistory, generateCheckoutUrl } from '@/lib/config/subscription-plans'
// 
// const hasUsedTrial = await checkIfStoreUsedTrial(storeId)
// const planType = getPlanTypeByHistory(hasUsedTrial)
// const checkoutUrl = generateCheckoutUrl(planType, backUrl)
