/**
 * MercadoPago Subscriptions SDK
 * Implementación completa para el manejo de suscripciones con MercadoPago
 */

import { SubscriptionPlan, Subscription, MercadoPagoPreapproval, SubscriptionPayment } from "@/lib/types/subscription"

interface MercadoPagoConfig {
  accessToken: string
  clientId?: string
  clientSecret?: string
  sandbox?: boolean
}

interface CreatePreapprovalParams {
  planId: string
  payerEmail: string
  storeId: string
  cardToken?: string
  backUrl?: string
}

interface CreatePlanParams {
  name: string
  displayName: string
  price: number
  billingFrequency: 'monthly' | 'yearly'
  trialPeriodDays?: number
  description?: string
}

interface PreapprovalWebhookData {
  id: string
  status: string
  payer_email: string
  reason: string
  auto_recurring: {
    start_date: string
    end_date?: string
    transaction_amount: number
    frequency: number
    frequency_type: string
  }
  summarized: {
    charged_quantity: number
    charged_amount: number
    pending_charge_quantity: number
    pending_charge_amount: number
  }
}

export class MercadoPagoSubscriptionsSDK {
  private accessToken: string
  private baseUrl: string
  
  constructor(config: MercadoPagoConfig) {
    this.accessToken = config.accessToken
    this.baseUrl = config.sandbox 
      ? 'https://api.mercadopago.com' 
      : 'https://api.mercadopago.com'
  }

  /**
   * Crear un plan de suscripción en MercadoPago
   */
  async createPlan(params: CreatePlanParams): Promise<{ id: string; init_point: string }> {
    const planData = {
      reason: params.displayName,
      back_url: "https://foodynow.com.ar/subscription/success",
      auto_recurring: {
        frequency: params.billingFrequency === 'monthly' ? 1 : 12,
        frequency_type: params.billingFrequency === 'monthly' ? 'months' : 'months',
        repetitions: 12, // Un año de suscripción
        billing_day: 1, // Cobrar el día 1 de cada mes
        billing_day_proportional: true,
        free_trial: params.trialPeriodDays ? {
          frequency: params.trialPeriodDays,
          frequency_type: 'days'
        } : undefined,
        transaction_amount: params.price,
        currency_id: 'ARS'
      },
      payment_methods_allowed: {
        payment_types: [
          { id: 'credit_card' },
          { id: 'debit_card' }
        ],
        payment_methods: [
          { id: 'visa' },
          { id: 'master' },
          { id: 'amex' }
        ]
      }
    }

    const response = await this.makeRequest('/preapproval_plan', 'POST', planData)
    return response
  }

  /**
   * Crear una preaprobación (suscripción) para un cliente
   */
  async createPreapproval(params: CreatePreapprovalParams): Promise<MercadoPagoPreapproval> {
    const preapprovalData: any = {
      preapproval_plan_id: params.planId,
      reason: `Suscripción FoodyNow`,
      payer_email: params.payerEmail,
      back_url: params.backUrl || `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      external_reference: params.storeId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/webhook`,
      auto_recurring: {
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 año
      }
    }

    // Agregar token de tarjeta si se proporciona
    if (params.cardToken) {
      preapprovalData.card_token_id = params.cardToken
    }

    const response = await this.makeRequest('/preapproval', 'POST', preapprovalData)
    return response
  }

  /**
   * Obtener información de una preaprobación
   */
  async getPreapproval(preapprovalId: string): Promise<PreapprovalWebhookData> {
    return await this.makeRequest(`/preapproval/${preapprovalId}`, 'GET')
  }

  /**
   * Pausar una suscripción
   */
  async pauseSubscription(preapprovalId: string): Promise<void> {
    await this.makeRequest(`/preapproval/${preapprovalId}`, 'PUT', {
      status: 'paused'
    })
  }

  /**
   * Reanudar una suscripción pausada
   */
  async resumeSubscription(preapprovalId: string): Promise<void> {
    await this.makeRequest(`/preapproval/${preapprovalId}`, 'PUT', {
      status: 'authorized'
    })
  }

  /**
   * Cancelar una suscripción
   */
  async cancelSubscription(preapprovalId: string): Promise<void> {
    await this.makeRequest(`/preapproval/${preapprovalId}`, 'PUT', {
      status: 'cancelled'
    })
  }

  /**
   * Obtener pagos de una suscripción
   */
  async getSubscriptionPayments(preapprovalId: string): Promise<SubscriptionPayment[]> {
    const response = await this.makeRequest(`/preapproval/${preapprovalId}/authorized_payments`, 'GET')
    return response.results || []
  }

  /**
   * Actualizar el precio de una suscripción
   */
  async updateSubscriptionPrice(preapprovalId: string, newAmount: number): Promise<void> {
    await this.makeRequest(`/preapproval/${preapprovalId}`, 'PUT', {
      auto_recurring: {
        transaction_amount: newAmount
      }
    })
  }

  /**
   * Procesar webhook de MercadoPago
   */
  async processWebhook(webhookData: any): Promise<{
    type: 'preapproval' | 'payment'
    id: string
    status: string
    data: any
  }> {
    const { type, data } = webhookData

    if (type === 'preapproval') {
      const preapprovalData = await this.getPreapproval(data.id)
      return {
        type: 'preapproval',
        id: data.id,
        status: preapprovalData.status,
        data: preapprovalData
      }
    }

    if (type === 'payment') {
      const paymentData = await this.getPayment(data.id)
      return {
        type: 'payment',
        id: data.id,
        status: paymentData.status,
        data: paymentData
      }
    }

    throw new Error(`Unsupported webhook type: ${type}`)
  }

  /**
   * Obtener información de un pago
   */
  private async getPayment(paymentId: string): Promise<any> {
    return await this.makeRequest(`/v1/payments/${paymentId}`, 'GET')
  }

  /**
   * Realizar request HTTP a la API de MercadoPago
   */
  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-Integrator-Id': 'dev_24c65fb163bf11ea96500242ac130004', // ID de integrador para FoodyNow
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      const responseData = await response.json()

      if (!response.ok) {
        console.error(`MercadoPago API Error [${method} ${endpoint}]:`, responseData)
        throw new MercadoPagoError(
          `MercadoPago API Error: ${responseData.message || response.statusText}`,
          response.status,
          responseData
        )
      }

      return responseData
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        throw error
      }
      
      console.error(`Network Error [${method} ${endpoint}]:`, error)
      throw new MercadoPagoError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        error
      )
    }
  }
}

/**
 * Error personalizado para MercadoPago
 */
export class MercadoPagoError extends Error {
  public status: number
  public response: any

  constructor(message: string, status: number, response: any) {
    super(message)
    this.name = 'MercadoPagoError'
    this.status = status
    this.response = response
  }
}

/**
 * Instancia singleton del SDK
 */
let sdk: MercadoPagoSubscriptionsSDK | null = null

export function getMercadoPagoSDK(): MercadoPagoSubscriptionsSDK {
  if (!sdk) {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN environment variable is required')
    }

    sdk = new MercadoPagoSubscriptionsSDK({
      accessToken,
      sandbox: process.env.NODE_ENV === 'development'
    })
  }

  return sdk
}
