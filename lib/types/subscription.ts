// Tipos para el sistema de suscripciones

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended'

export type PaymentFrequency = 'monthly' | 'yearly' | 'one_time'

export type SubscriptionPaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled'

export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  description?: string
  price: number
  currency: string
  frequency: PaymentFrequency
  durationDays: number
  trialDays: number
  isTrial: boolean
  isActive: boolean
  features: string[]
  maxProducts?: number
  maxOrdersPerMonth?: number
  priority: number
}

export interface Subscription {
  id: string
  storeId: string
  planId: string
  status: SubscriptionStatus
  trialStartedAt?: string
  trialEndsAt?: string
  paidStartedAt?: string
  paidEndsAt?: string
  mercadopagoSubscriptionId?: string
  mercadopagoPreapprovalId?: string
  autoRenewal: boolean
  cancelledAt?: string
  cancellationReason?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface SubscriptionPayment {
  id: string
  subscriptionId: string
  planId: string
  amount: number
  currency: string
  status: SubscriptionPaymentStatus
  mercadopagoPaymentId?: string
  mercadopagoPreferenceId?: string
  mercadopagoMerchantOrderId?: string
  paymentDate?: string
  dueDate?: string
  processedAt?: string
  periodStart: string
  periodEnd: string
  paymentMethod?: string
  payerEmail?: string
  externalReference?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface SubscriptionUsage {
  id: string
  subscriptionId: string
  periodStart: string
  periodEnd: string
  productsCount: number
  ordersCount: number
  apiCallsCount: number
  storageUsedMb: number
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Tipos para las respuestas de la API

export interface CreateSubscriptionRequest {
  planId: string
  storeId: string
}

export interface CreateSubscriptionResponse {
  success: boolean
  subscriptionId: string
  type: 'trial' | 'paid'
  expiresAt?: string
  preferenceId?: string
  initPoint?: string
  sandboxInitPoint?: string
  message?: string
  error?: string
}

export interface SubscriptionStatusResponse {
  success: boolean
  hasSubscription: boolean
  isActive?: boolean
  subscription?: {
    id: string
    status: SubscriptionStatus
    daysLeft: number
    expiresAt?: string
    autoRenewal: boolean
    plan?: {
      id: string
      name: string
      displayName: string
      price: number
      frequency: PaymentFrequency
      features: string[]
    }
  }
  store: {
    id: string
    name: string
  }
  error?: string
}

export interface SubscriptionPlansResponse {
  success: boolean
  plans: SubscriptionPlan[]
  error?: string
}

// Tipos para componentes

export interface PricingCardProps {
  plan: SubscriptionPlan
  onSubscribe: (planId: string) => void
  isLoading?: boolean
  isPopular?: boolean
}

export interface TrialBannerProps {
  daysLeft: number
  onUpgrade: () => void
}

export interface SubscriptionContextType {
  subscription: SubscriptionStatusResponse | null
  plans: SubscriptionPlan[]
  isLoading: boolean
  createSubscription: (planId: string, storeId: string) => Promise<CreateSubscriptionResponse>
  checkStatus: () => Promise<void>
  refreshPlans: () => Promise<void>
}

// Tipos para el middleware

export interface SubscriptionMiddlewareData {
  isActive: boolean
  status: SubscriptionStatus
  expiresAt?: string
  daysLeft: number
}

// Tipos para webhooks de MercadoPago

export interface MercadoPagoWebhookData {
  id: string
  live_mode: boolean
  type: string
  date_created: string
  application_id: string
  user_id: string
  version: string
  api_version: string
  action: string
  data: {
    id: string
  }
}

export interface MercadoPagoPaymentData {
  id: number
  date_created: string
  date_approved?: string
  date_last_updated: string
  date_of_expiration?: string
  money_release_date?: string
  operation_type: string
  issuer_id: string
  payment_method_id: string
  payment_type_id: string
  status: string
  status_detail: string
  currency_id: string
  description?: string
  live_mode: boolean
  sponsor_id?: number
  authorization_code?: string
  money_release_schema?: string
  taxes_amount: number
  counter_currency?: string
  brand_id?: string
  shipping_amount: number
  pos_id?: string
  store_id?: string
  integrator_id?: string
  platform_id?: string
  corporation_id?: string
  payer: {
    type: string
    id: string
    email: string
    identification?: {
      type: string
      number: string
    }
    phone?: {
      area_code: string
      number: string
      extension?: string
    }
    first_name?: string
    last_name?: string
    entity_type?: string
  }
  marketplace_owner?: number
  metadata: Record<string, any>
  additional_info?: {
    available_balance?: number
    nsu_processadora?: string
    authentication_code?: string
  }
  order?: {
    type: string
    id: string
  }
  external_reference?: string
  transaction_amount: number
  transaction_amount_refunded: number
  coupon_amount: number
  differential_pricing_id?: number
  deduction_schema?: string
  installments: number
  transaction_details: {
    payment_method_reference_id?: string
    net_received_amount: number
    total_paid_amount: number
    overpaid_amount: number
    external_resource_url?: string
    installment_amount: number
    financial_institution?: string
    payable_deferral_period?: string
    acquirer_reference?: string
  }
  fee_details: Array<{
    type: string
    amount: number
    fee_payer: string
  }>
  charges_details: Array<{
    id: string
    name: string
    type: string
    accounts: {
      from: string
      to: string
    }
    client_id: number
    date_created: string
    last_updated: string
  }>
  captured: boolean
  binary_mode: boolean
  call_for_authorize_id?: string
  statement_descriptor?: string
  card?: {
    id?: string
    last_four_digits?: string
    first_six_digits?: string
    year?: number
    month?: number
    expiration_month?: number
    expiration_year?: number
    date_created?: string
    date_last_updated?: string
    cardholder?: {
      name?: string
      identification?: {
        number?: string
        type?: string
      }
    }
  }
  notification_url?: string
  refunds: any[]
}
