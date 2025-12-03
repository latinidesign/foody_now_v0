// Tipos para el sistema de suscripciones

export type SubscriptionStatus = 'trial' | 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended' | 'past_due'

export interface Store {
  id: string
  name: string
  slug: string
}

export type PaymentFrequency = 'monthly' | 'yearly' | 'one_time'

export type SubscriptionPaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled'

export interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  price: number
  billing_frequency: 'monthly' | 'yearly'
  trial_period_days: number
  is_trial: boolean
  mercadopago_plan_id?: string
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  store_id: string
  plan_id: string
  status: 'trial' | 'active' | 'cancelled' | 'past_due' | 'expired'
  mercadopago_preapproval_id?: string
  mercadopago_subscription_id?: string
  trial_started_at?: string
  trial_ends_at?: string
  billing_started_at?: string
  next_billing_date?: string
  last_payment_date?: string
  auto_renewal: boolean
  created_at: string
  updated_at: string
  plan?: SubscriptionPlan
  store?: Store
}

export interface SubscriptionPayment {
  id: string
  subscription_id: string
  mercadopago_payment_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  payment_date?: string
  billing_period_start: string
  billing_period_end: string
  created_at: string
}

// Tipos para MercadoPago
export interface MercadoPagoPreapproval {
  id: string
  payer_id: number
  payer_email: string
  status: 'pending' | 'authorized' | 'paused' | 'cancelled'
  reason: string
  init_point: string
  auto_recurring: {
    frequency: number
    frequency_type: string
    start_date: string
    end_date?: string
    transaction_amount: number
  }
  summarized: {
    charged_quantity: number
    charged_amount: number
    pending_charge_quantity: number
    pending_charge_amount: number
  }
}

export interface MercadoPagoWebhookEvent {
  action: string
  api_version: string
  data: {
    id: string
  }
  date_created: string
  id: number
  live_mode: boolean
  type: 'payment' | 'preapproval' | 'subscription'
  user_id: string
}
