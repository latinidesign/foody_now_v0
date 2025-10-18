export type DeliveryType = "pickup" | "delivery"
export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export interface Store {
  id: string
  owner_id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  header_image_url?: string
  primary_color: string
  phone?: string
  email?: string
  address?: string
  delivery_radius: number
  delivery_fee: number
  min_order_amount: number
  is_active: boolean
  extended_description?: string
  gallery_images?: string[]
  website?: string
  whatsapp_phone?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  store_id: string
  name: string
  description?: string
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  store_id: string
  category_id?: string
  name: string
  description?: string
  price: number
  sale_price?: number
  image_url?: string
  gallery_images?: string[]
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ProductOption {
  id: string
  product_id: string
  name: string
  type: "single" | "multiple"
  is_required: boolean
  created_at: string
  values?: ProductOptionValue[]
}

export interface ProductOptionValue {
  id: string
  option_id: string
  name: string
  price_modifier: number
  sort_order: number
  created_at: string
}

export interface Order {
  id: string
  store_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_type: DeliveryType
  delivery_address?: string
  delivery_notes?: string
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  payment_status: PaymentStatus
  payment_id?: string
  estimated_delivery_time?: number
  notes?: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  selected_options?: Record<string, any>
  created_at: string
  product?: Product
}

export interface Payment {
  id: string
  order_id: string
  store_id: string
  provider: string
  provider_payment_id?: string | null
  preference_id?: string | null
  mp_payment_id?: string | null
  payment_method?: string | null
  status?: string | null
  status_detail?: string | null
  transaction_amount?: number | null
  currency?: string | null
  payer_email?: string | null
  collector_id?: string | null
  source_type?: string | null
  metadata?: Record<string, unknown> | null
  raw?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface StoreSettings {
  id: string
  store_id: string
  whatsapp_number?: string
  whatsapp_notifications_enabled?: boolean
  whatsapp_message?: string
  wa_phone_number_id?: string
  wa_business_account_id?: string
  wa_access_token?: string
  wa_metadata?: Record<string, any>
  mercadopago_access_token?: string
  mercadopago_public_key?: string
  business_hours?: Record<string, any>
  is_open: boolean
  welcome_message?: string
  order_confirmation_message?: string
  created_at: string
  updated_at: string
}
