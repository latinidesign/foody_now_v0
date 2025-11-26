/**
 * Servicio de Suscripciones FoodyNow
 * Maneja toda la lógica de negocio para las suscripciones usando MercadoPago
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { getMercadoPagoSDK, MercadoPagoError } from "../payments/providers/mercadopago-subscriptions"
import { Subscription, SubscriptionPlan, SubscriptionPayment, SubscriptionStatus } from "@/lib/types/subscription"

export interface CreateSubscriptionParams {
  storeId: string
  planId: string
  payerEmail: string
  cardToken?: string
}

export interface SubscriptionService {
  // Gestión de planes
  getPlans(): Promise<SubscriptionPlan[]>
  getPlan(planId: string): Promise<SubscriptionPlan | null>
  createPlan(plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>): Promise<SubscriptionPlan>
  
  // Gestión de suscripciones
  createSubscription(params: CreateSubscriptionParams): Promise<{ subscription: Subscription; initPoint: string }>
  getSubscription(storeId: string): Promise<Subscription | null>
  cancelSubscription(storeId: string): Promise<void>
  pauseSubscription(storeId: string): Promise<void>
  resumeSubscription(storeId: string): Promise<void>
  
  // Webhooks y sincronización
  handleWebhook(webhookData: any): Promise<void>
  syncSubscriptionStatus(subscriptionId: string): Promise<Subscription>
  
  // Pagos y facturación
  getSubscriptionPayments(subscriptionId: string): Promise<SubscriptionPayment[]>
  
  // Utilidades
  isSubscriptionActive(storeId: string): Promise<boolean>
  getTrialStatus(storeId: string): Promise<{ inTrial: boolean; daysLeft: number }>
}

export class FoodyNowSubscriptionService implements SubscriptionService {
  private supabase = createAdminClient()
  private mpSDK = getMercadoPagoSDK()

  /**
   * Obtener todos los planes disponibles
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching subscription plans:', error)
      throw new Error('Error al obtener planes de suscripción')
    }

    return data || []
  }

  /**
   * Obtener un plan específico
   */
  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No encontrado
      console.error('Error fetching subscription plan:', error)
      throw new Error('Error al obtener el plan de suscripción')
    }

    return data
  }

  /**
   * Crear un nuevo plan de suscripción
   */
  async createPlan(planData: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>): Promise<SubscriptionPlan> {
    try {
      // Crear plan en MercadoPago primero
      const mpPlan = await this.mpSDK.createPlan({
        name: planData.name,
        displayName: planData.display_name,
        price: planData.price,
        billingFrequency: planData.billing_frequency,
        trialPeriodDays: planData.trial_period_days,
        description: `Plan ${planData.display_name} - FoodyNow`
      })

        // Guardar plan en la base de datos
        const { data, error } = await this.supabase
          .from('subscription_plans')
          .insert({
            ...planData,
            frequency: planData.billing_frequency, // Agregar el campo frequency
            mercadopago_plan_id: mpPlan.id
          })
          .select()
          .single()

      if (error) {
        console.error('Error creating subscription plan:', error)
        throw new Error('Error al crear el plan de suscripción')
      }

      return data
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        console.error('MercadoPago error creating plan:', error)
        throw new Error(`Error en MercadoPago: ${error.message}`)
      }
      console.error('Unexpected error creating plan:', error)
      throw new Error('Error inesperado al crear el plan')
    }
  }

  /**
   * Crear una nueva suscripción
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<{ subscription: Subscription; initPoint: string }> {
    const { storeId, planId, payerEmail, cardToken } = params

    // Verificar que la tienda existe
    const { data: store, error: storeError } = await this.supabase
      .from('stores')
      .select('id, name, slug')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      throw new Error('Tienda no encontrada')
    }

    // Verificar que el plan existe y está activo
    const plan = await this.getPlan(planId)
    if (!plan || !plan.mercadopago_plan_id) {
      throw new Error('Plan no encontrado o no configurado')
    }

    // Verificar que no tenga suscripción activa
    const existingSubscription = await this.getSubscription(storeId)
    if (existingSubscription && ['trial', 'active'].includes(existingSubscription.status)) {
      throw new Error('La tienda ya tiene una suscripción activa')
    }

    try {
      // Crear preaprobación en MercadoPago
      const preapproval = await this.mpSDK.createPreapproval({
        planId: plan.mercadopago_plan_id,
        payerEmail,
        storeId,
        cardToken,
        backUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?store_id=${storeId}`
      })

      // Calcular fechas del trial
      const now = new Date()
      const trialStarted = now
      const trialEnds = new Date(now)
      trialEnds.setDate(trialEnds.getDate() + plan.trial_period_days)

      // Crear suscripción en la base de datos
      const { data: subscription, error: subscriptionError } = await this.supabase
        .from('subscriptions')
        .insert({
          store_id: storeId,
          plan_id: planId,
          status: 'trial' as SubscriptionStatus,
          mercadopago_preapproval_id: preapproval.id,
          trial_started_at: trialStarted.toISOString(),
          trial_ends_at: trialEnds.toISOString(),
          auto_renewal: true
        })
        .select(`
          *,
          plan:subscription_plans(*),
          store:stores!subscriptions_store_id_fkey(*)
        `)
        .single()

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
        // Intentar cancelar la preaprobación en MercadoPago si falla la creación local
        try {
          await this.mpSDK.cancelSubscription(preapproval.id)
        } catch (cancelError) {
          console.error('Error canceling preapproval after subscription creation failure:', cancelError)
        }
        throw new Error('Error al crear la suscripción')
      }

      return {
        subscription,
        initPoint: preapproval.init_point
      }
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        console.error('MercadoPago error creating subscription:', error)
        throw new Error(`Error en MercadoPago: ${error.message}`)
      }
      console.error('Unexpected error creating subscription:', error)
      throw new Error('Error inesperado al crear la suscripción')
    }
  }

  /**
   * Obtener suscripción de una tienda
   */
  async getSubscription(storeId: string): Promise<Subscription | null> {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*),
        store:stores!subscriptions_store_id_fkey(*)
      `)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching subscription:', error)
      throw new Error('Error al obtener la suscripción')
    }

    return data
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(storeId: string): Promise<void> {
    const subscription = await this.getSubscription(storeId)
    if (!subscription) {
      throw new Error('Suscripción no encontrada')
    }

    if (subscription.mercadopago_preapproval_id) {
      try {
        await this.mpSDK.cancelSubscription(subscription.mercadopago_preapproval_id)
      } catch (error) {
        console.error('Error canceling subscription in MercadoPago:', error)
        // Continuar con la cancelación local aunque falle en MP
      }
    }

    // Actualizar estado local
    const { error } = await this.supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (error) {
      console.error('Error updating subscription status:', error)
      throw new Error('Error al cancelar la suscripción')
    }
  }

  /**
   * Pausar suscripción
   */
  async pauseSubscription(storeId: string): Promise<void> {
    const subscription = await this.getSubscription(storeId)
    if (!subscription || !subscription.mercadopago_preapproval_id) {
      throw new Error('Suscripción no encontrada')
    }

    try {
      await this.mpSDK.pauseSubscription(subscription.mercadopago_preapproval_id)
      
      // Actualizar estado local
      await this.supabase
        .from('subscriptions')
        .update({
          status: 'suspended',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        throw new Error(`Error pausando suscripción: ${error.message}`)
      }
      console.error('Unexpected error pausing subscription:', error)
      throw new Error('Error inesperado al pausar la suscripción')
    }
  }

  /**
   * Reanudar suscripción pausada
   */
  async resumeSubscription(storeId: string): Promise<void> {
    const subscription = await this.getSubscription(storeId)
    if (!subscription || !subscription.mercadopago_preapproval_id) {
      throw new Error('Suscripción no encontrada')
    }

    try {
      await this.mpSDK.resumeSubscription(subscription.mercadopago_preapproval_id)
      
      // Actualizar estado local
      await this.supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        throw new Error(`Error reanudando suscripción: ${error.message}`)
      }
      console.error('Unexpected error resuming subscription:', error)
      throw new Error('Error inesperado al reanudar la suscripción')
    }
  }

  /**
   * Manejar webhooks de MercadoPago
   */
  async handleWebhook(webhookData: any): Promise<void> {
    try {
      const processedData = await this.mpSDK.processWebhook(webhookData)

      if (processedData.type === 'preapproval') {
        await this.handlePreapprovalWebhook(processedData.id, processedData.data)
      } else if (processedData.type === 'payment') {
        await this.handlePaymentWebhook(processedData.id, processedData.data)
      }
    } catch (error) {
      console.error('Error processing webhook:', error)
      throw error
    }
  }

  /**
   * Manejar webhook de preaprobación
   */
  private async handlePreapprovalWebhook(preapprovalId: string, preapprovalData: any): Promise<void> {
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('mercadopago_preapproval_id', preapprovalId)
      .single()

    if (!subscription) {
      console.log('Subscription not found for preapproval:', preapprovalId)
      return
    }

    // Mapear estado de MercadoPago a nuestro estado
    let newStatus: SubscriptionStatus
    switch (preapprovalData.status) {
      case 'authorized':
        newStatus = 'active'
        break
      case 'paused':
        newStatus = 'suspended'
        break
      case 'cancelled':
        newStatus = 'cancelled'
        break
      default:
        newStatus = subscription.status
    }

    // Actualizar suscripción
    await this.supabase
      .from('subscriptions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)
  }

  /**
   * Manejar webhook de pago
   */
  private async handlePaymentWebhook(paymentId: string, paymentData: any): Promise<void> {
    // Buscar la suscripción por el external_reference o preapproval_id
    const externalReference = paymentData.external_reference
    if (!externalReference) return

    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('store_id', externalReference)
      .single()

    if (!subscription) return

    // Registrar el pago
    await this.supabase
      .from('subscription_payments')
      .upsert({
        subscription_id: subscription.id,
        mercadopago_payment_id: paymentId,
        amount: paymentData.transaction_amount,
        status: paymentData.status,
        payment_date: paymentData.status === 'approved' ? new Date().toISOString() : null,
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      })

    // Si el pago fue aprobado, actualizar la suscripción
    if (paymentData.status === 'approved') {
      await this.supabase
        .from('subscriptions')
        .update({
          status: 'active',
          last_payment_date: new Date().toISOString(),
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id)
    }
  }

  /**
   * Sincronizar estado de suscripción con MercadoPago
   */
  async syncSubscriptionStatus(subscriptionId: string): Promise<Subscription> {
    const { data: subscription, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()

    if (error || !subscription || !subscription.mercadopago_preapproval_id) {
      throw new Error('Suscripción no encontrada')
    }

    try {
      const preapprovalData = await this.mpSDK.getPreapproval(subscription.mercadopago_preapproval_id)
      
      // Actualizar estado basado en MercadoPago
      let newStatus: SubscriptionStatus
      switch (preapprovalData.status) {
        case 'authorized':
          newStatus = 'active'
          break
        case 'paused':
          newStatus = 'suspended'
          break
        case 'cancelled':
          newStatus = 'cancelled'
          break
        default:
          newStatus = subscription.status
      }

      const { data: updatedSubscription } = await this.supabase
        .from('subscriptions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select(`
          *,
          plan:subscription_plans(*),
          store:stores!subscriptions_store_id_fkey(*)
        `)
        .single()

      return updatedSubscription
    } catch (error) {
      if (error instanceof MercadoPagoError) {
        throw new Error(`Error sincronizando con MercadoPago: ${error.message}`)
      }
      console.error('Unexpected error syncing subscription:', error)
      throw new Error('Error inesperado al sincronizar la suscripción')
    }
  }

  /**
   * Obtener pagos de una suscripción
   */
  async getSubscriptionPayments(subscriptionId: string): Promise<SubscriptionPayment[]> {
    const { data, error } = await this.supabase
      .from('subscription_payments')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscription payments:', error)
      throw new Error('Error al obtener los pagos de la suscripción')
    }

    return data || []
  }

  /**
   * Verificar si una suscripción está activa
   */
  async isSubscriptionActive(storeId: string): Promise<boolean> {
    const subscription = await this.getSubscription(storeId)
    
    if (!subscription) return false
    
    // Verificar si está en trial y no ha expirado
    if (subscription.status === 'trial' && subscription.trial_ends_at) {
      const trialEnd = new Date(subscription.trial_ends_at)
      const now = new Date()
      return now < trialEnd
    }
    
    // Verificar si está activa
    return subscription.status === 'active'
  }

  /**
   * Obtener estado del trial
   */
  async getTrialStatus(storeId: string): Promise<{ inTrial: boolean; daysLeft: number }> {
    const subscription = await this.getSubscription(storeId)
    
    if (!subscription || subscription.status !== 'trial' || !subscription.trial_ends_at) {
      return { inTrial: false, daysLeft: 0 }
    }
    
    const trialEnd = new Date(subscription.trial_ends_at)
    const now = new Date()
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    
    return {
      inTrial: daysLeft > 0,
      daysLeft
    }
  }
}

// Instancia singleton del servicio
let subscriptionService: FoodyNowSubscriptionService | null = null

export function getSubscriptionService(): FoodyNowSubscriptionService {
  if (!subscriptionService) {
    subscriptionService = new FoodyNowSubscriptionService()
  }
  return subscriptionService
}
