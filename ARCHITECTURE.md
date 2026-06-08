# ARCHITECTURE.md

## Qué hace este sistema

FoodyNow es una plataforma SaaS que permite a dueños de negocios de comida crear su propia tienda online con catálogo de productos, carrito de compras, pagos con MercadoPago y notificaciones por WhatsApp.

## Qué no hace

- No tiene delivery propio (el dueño gestiona sus entregas)
- No tiene sistema de reseñas ni valoraciones de clientes
- No tiene chat en vivo
- No tiene integración con apps de delivery tipo Rappi o PedidosYa
- No soporta multi-idioma
- No tiene panel de superadmin ni administración global de tiendas
- No tiene roles de empleado o cajero por tienda

## Actores y roles

| Actor | Descripción |
|-------|-------------|
| **Owner** (dueño del negocio) | Se registra, confirma email, completa onboarding, crea y configura su tienda, gestiona productos, categorías y pedidos, paga la suscripción mensual |
| **Cliente** | Navega la tienda pública, ve productos y categorías, arma carrito, paga con MercadoPago o efectivo, recibe confirmación por WhatsApp |

No existe superadmin de FoodyNow ni roles de empleado por tienda.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript ~v5 |
| UI | React 19 + Tailwind CSS 4 |
| Componentes | shadcn/ui (Radix UI primitives) |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth (email/password) |
| Pagos | MercadoPago (Checkout Pro + Suscripciones Recurrentes) |
| Notificaciones | WhatsApp (wa.me links; Cloud API documentada pero no operativa) |
| Deploy producción | Vercel |
| Desarrollo local | Docker (multi-stage build, Node 20 Alpine) |
| Package manager | pnpm (lockfile presente) / npm (package-lock presente, coexistencia) |

## Modelo de auth

- **Registro**: Supabase `auth.signUp()` con email + password, capturando `first_name`, `last_name` y `full_name` en metadata
- **Confirmación**: Email de confirmación obligatorio. La página `/auth/confirm` soporta 4 métodos de verificación (exchange code, verify OTP, getUser, sesión activa)
- **Login**: `signInWithPassword()`. Post-login redirige a `/admin` si la tienda tiene onboarding completo, o a `/onboarding` si no
- **Middleware**: `proxy.ts` es el punto de entrada de todas las requests. Usa `updateSession()` de `@supabase/ssr` para manejar cookies y refrescar sesión. Las rutas públicas (`/auth`, `/store`, `/api`, `/privacy`, etc.) no requieren autenticación
- **Autorización**: RLS (Row Level Security) en Supabase. Cada owner ve solo sus propios registros vía `auth.uid() = owner_id`. Los clientes anónimos pueden leer tiendas activas y productos

## Modelo de estado y flujo de datos

- **Server-Side**: Los datos de tienda, productos, categorías y pedidos se cargan en Server Components (SSR) o API Routes. No hay estado de servidor compartido entre requests
- **Cliente**: El carrito de compras vive en `CartProvider` (React Context + `useReducer`). No hay store global (Redux, Zustand). Cada página maneja su propio estado local
- **Webhooks**: Los webhooks de MercadoPago actualizan pagos, órdenes y suscripciones fuera de banda. Supabase Realtime (WebSocket) activo en el panel de pedidos del admin para recibir INSERT en la tabla orders en tiempo real. No hay otros WebSockets en el sistema.
- **Cola**: Hay una cola de WhatsApp (`lib/queue/whatsapp-queue.ts`) con inicializador (`lib/queue/queue-initializer.ts`) pero no se detectó un worker de cola activo en producción

## Rutas y multi-tenancy

El `proxy.ts` actúa como middleware de edge (Vercel) y maneja dos modos de acceso:

| Modo | Ejemplo | Mecanismo |
|------|---------|-----------|
| **Subdominio** | `tutienda.foodynow.com.ar` | Rewrite a `/store/tutienda` |
| **Path** | `foodynow.com.ar/store/tutienda` | Redirección 301 al subdominio |

Ambos modos están activos. El middleware detecta si el host es un dominio principal (`foodynow.com.ar`, `localhost`, etc.) o un subdominio de tienda.

### Rutas principales

**Públicas**: `/`, `/landing`, `/que-es`, `/que-es-foody-now`, `/ayuda`, `/terms`, `/privacy`, `/offline`, `/demo`, `/subscriptions`

**Auth**: `/auth/login`, `/auth/sign-up`, `/auth/sign-up-success`, `/auth/confirm`, `/auth/resend-confirmation`, `/fix-confirmation`

**Store (cliente)**: `/store/[slug]`, `/store/[slug]/about`, `/store/[slug]/checkout`, `/store/[slug]/product/[productId]`, `/store/[slug]/order/[orderId]`, `/store/[slug]/success|failure|pending`

**Admin (owner)**: `/admin` (dashboard), `/admin/orders`, `/admin/products`, `/admin/categories`, `/admin/settings`, `/admin/whatsapp`, `/admin/analytics`, `/admin/subscription`, `/admin/profile`, `/admin/help`

**Setup**: `/onboarding`, `/admin/setup`, `/store-settings`

## Entidades del dominio

### stores

Dueño del negocio. Cada store pertenece a un `owner_id` (auth.users).

```typescript
interface Store {
  id: string
  owner_id: string
  name: string
  slug: string            // único, usado en subdominio/path
  description?: string
  logo_url?: string
  header_image_url?: string
  primary_color: string   // default '#2D5016'
  phone?: string
  email?: string
  address?: string
  delivery_radius: number // km
  delivery_fee: number
  min_order_amount: number
  is_active: boolean
  whatsapp_phone?: string
  is_onboarded: boolean   // onboarding completado
  trial_used: boolean     // ya usó el período de prueba
  subscription_status?: subscription_status
  subscription_expires_at?: string
  created_at: string
  updated_at: string
}
```

### categories

Agrupación de productos dentro de una tienda.

```typescript
interface Category {
  id: string
  store_id: string        // FK -> stores.id
  name: string
  description?: string
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
}
```

### products

Producto individual con precio y configuración de pricing.

```typescript
interface Product {
  id: string
  store_id: string        // FK -> stores.id
  category_id?: string    // FK -> categories.id
  name: string
  description?: string
  price: number
  sale_price?: number
  pricing_config?: PricingConfig | null  // ver sección de pricing
  image_url?: string
  gallery_images?: string[]
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}
```

### product_options / product_option_values

Personalizaciones del producto (ej: tipo de masa, tamaño, ingredientes extra).

```typescript
interface ProductOption {
  id: string
  product_id: string      // FK -> products.id
  name: string
  type: "single" | "multiple" | "quantity"
  is_required: boolean
  values?: ProductOptionValue[]
}

interface ProductOptionValue {
  id: string
  option_id: string       // FK -> product_options.id
  name: string
  price_modifier: number  // ajuste al precio base
  sort_order: number
}
```

### orders / order_items

Pedido realizado por un cliente.

```typescript
interface Order {
  id: string
  store_id: string        // FK -> stores.id
  order_number?: number   // secuencial por tienda (RPC get_next_order_number)
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_type: DeliveryType  // "pickup" | "delivery"
  delivery_address?: string
  delivery_notes?: string
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus     // pending | confirmed | preparing | ready | sent | delivered | cancelled
  payment_status: PaymentStatus  // pending | completed | failed | refunded
  payment_id?: string
  estimated_delivery_time?: number  // minutos
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

interface OrderItem {
  id: string
  order_id: string        // FK -> orders.id
  product_id: string      // FK -> products.id
  quantity: number
  unit_price: number
  total_price: number
  selected_options?: Record<string, any>  // opciones elegidas
  pricing_snapshot?: PricingSnapshot | null  // snapshot del pricing al momento de la compra
}
```

### payments / checkout_sessions

Pagos procesados por MercadoPay.

```typescript
interface Payment {
  id: string
  order_id: string        // FK -> orders.id
  store_id: string        // FK -> stores.id
  provider: string        // "mercadopago"
  provider_payment_id?: string
  preference_id?: string
  mp_payment_id?: string
  payment_method?: string
  status?: string
  status_detail?: string
  transaction_amount?: number
  payer_email?: string
  collector_id?: string
  metadata?: Record<string, unknown>
  raw?: Record<string, unknown>  // payload completo de MP
}
```

### store_settings

Configuración por tienda: WhatsApp, MercadoPago OAuth, horarios.

```typescript
interface StoreSettings {
  id: string
  store_id: string        // FK -> stores.id (UNIQUE)
  whatsapp_number?: string
  whatsapp_notifications_enabled?: boolean
  wa_phone_number_id?: string
  wa_business_account_id?: string
  wa_access_token?: string
  mercadopago_access_token?: string
  mercadopago_public_key?: string
  business_hours?: Record<string, any>
  is_open: boolean
  welcome_message?: string
  order_confirmation_message?: string
}
```

### mp_accounts

Tokens OAuth de MercadoPago por tienda (Conexión de cuenta del vendedor).

```typescript
interface MpAccount {
  store_id: string        // PK, FK -> stores.id
  mp_user_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
  public_key: string
  status: string          // "connected"
  raw?: Record<string, unknown>
}
```

### subscription_plans

Planes de suscripción disponibles.

```typescript
interface SubscriptionPlan {
  id: string
  name: string            // "trial", "basic_monthly", "basic_yearly"
  display_name: string
  description: string
  price: number           // 48000 ARS (plan mensual)
  currency: string        // "ARS"
  frequency: PaymentFrequency  // "monthly" | "yearly" | "one_time"
  duration_days: number
  trial_days: number
  is_trial: boolean
  mercadopago_plan_id: string  // ID del plan en MP
  is_active: boolean
  features: Record<string, any>
  max_products: number
  max_orders_per_month: number
}
```

### subscriptions

Suscripción activa de una tienda (modelo definitivo).

```typescript
interface Subscription {
  id: string
  store_id: string        // FK -> stores.id (UNIQUE)
  plan_id: string         // FK -> subscription_plans.id
  status: SubscriptionStatus  // trial | pending | active | expired | cancelled | suspended | past_due
  mercadopago_preapproval_id: string  // ID de la preaprobación en MP
  trial_started_at?: string
  trial_ends_at?: string
  paid_started_at?: string
  paid_ends_at?: string
  next_billing_date?: string
  last_payment_date?: string
  auto_renewal: boolean
  cancelled_at?: string
  cancellation_reason?: string
  metadata?: Record<string, any>
}
```

### subscription_payments

Historial de pagos de una suscripción.

```typescript
interface SubscriptionPayment {
  id: string
  subscription_id: string  // FK -> subscriptions.id
  plan_id: string          // FK -> subscription_plans.id
  amount: number
  currency: string
  status: SubscriptionPaymentStatus  // pending | approved | rejected | refunded | cancelled
  mercadopago_payment_id: string
  mercadopago_preference_id?: string
  payment_date?: string
  due_date?: string
  period_start?: string
  period_end?: string
  payment_method?: string
  payer_email?: string
  external_reference?: string
}
```

## Pricing (modos de precio)

El sistema soporta tres modos de precio definidos en `lib/utils/pricing.ts`:

### Modo simple (`unit_only` con `quantity: 1`)

Sin pricing config o con `mode: "unit_only"` y `quantity: 1`. El precio se calcula como `price * cantidad`.

```typescript
type UnitOnlySimple = {
  mode: "unit_only"
  unit_price: number  // precio por unidad
  quantity: 1         // una unidad = un ítem
}
```

### Modo unidad + media docena + docena

Precio escalonado típico para empanadas, facturas, etc.

```typescript
type UnitHalfDozenDozen = {
  mode: "unit_half_dozen_dozen"
  unit_price: number
  half_dozen_price: number   // precio por 6 unidades
  dozen_price: number        // precio por 12 unidades
}
```

### Modo pack o conjunto

`unit_only` con `quantity > 1`. La "unidad" de venta es un conjunto de N ítems. Ej: pack de 8 empanadas con precio fijo, docena de facturas, catorcena, etc.

```typescript
type PackPricing = {
  mode: "unit_only"
  unit_price: number  // precio del pack
  quantity: number    // cantidad de ítems por pack (ej: 8, 12, 14)
}
```

El cálculo usa `Math.ceil(cantidad_solicitada / quantity)` para determinar cuántos packs cobrar.

## Contratos principales

### API de pagos

```
POST /api/payments/create-preference
  → body: { store_id, items, order_data, payer_info }
  → Crea checkout_session en DB + preferencia en MP
  → response: { preference_id, init_point, session_id }

POST /api/payments/charge
  → body: { store_id, items, order_data, payment_token }
  → Cargo directo con tarjeta via MP API
  → response: { status, payment_id }

POST /api/webhook/mercadopago
  → Procesa topic=payment y topic=merchant_order
  → Upsert en payments
  → Actualiza orders.status y orders.payment_status
  → Encola notificación WhatsApp
```

### API de suscripciones

```
GET  /api/subscription/plans → lista de subscription_plans activos

POST /api/subscription/create
  → body: { store_id, plan_id, payer_email }
  → Determina si aplica trial (según stores.trial_used)
  → Crea preaprobación en MP
  → Crea registro en subscriptions
  → response: { subscription, init_point }

POST /api/subscription/cancel
  → body: { store_id }
  → Cancela en MP + actualiza status a 'cancelled'

GET  /api/subscription/status?store_id=xxx
  → response: { status, trial, billing }

POST /api/subscription/webhook
  → Procesa webhooks de MP (preapproval y payment)
  → Actualiza subscription.status según mapeo:
      authorized → active
      pending    → pending
      paused     → suspended
      cancelled  → cancelled
  → Registra subscription_payments

POST /api/subscription/sync/[subscriptionId]
  → Consulta estado actual en MP
  → Sincroniza con DB
```

### API de pedidos

```
POST /api/orders
  → body: { store_id, items, customer_data, delivery_type }
  → Calcula total con pricing_config
  → Obtiene order_number via RPC get_next_order_number()
  → Crea order + order_items
  → response: { order }

POST /api/orders/create-cash
  → body: { store_id, items, customer_data, delivery_type }
  → Similar a /api/orders pero sin integración de pago
```

### API de WhatsApp

```
GET  wa.me links (operativo)
  → whatsappService.getOrderNotificationLink()
  → whatsappService.getCustomerConfirmationLink()
  → whatsappService.generateStoreLink()

POST Cloud API (implementada pero no operativa por falta de verificación business)
  → sendCloudApiMessage() → fallback a wa.me
```

## Tipos y primitivos compartidos

### Enums de la base de datos (PostgreSQL)

```sql
CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery')
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'sent', 'delivered', 'cancelled')
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded')
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'expired', 'cancelled', 'suspended', 'past_due')
CREATE TYPE payment_frequency AS ENUM ('monthly', 'yearly', 'one_time')
CREATE TYPE subscription_payment_status AS ENUM ('pending', 'approved', 'rejected', 'refunded', 'cancelled')
```

### Tipos del frontend

```typescript
type DeliveryType = "pickup" | "delivery"
type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "sent" | "delivered" | "cancelled"
type PaymentStatus = "pending" | "completed" | "failed" | "refunded"
type SubscriptionStatus = "trial" | "pending" | "active" | "expired" | "cancelled" | "suspended" | "past_due"
type PaymentProviderKey = "mercadopago"
type PlanType = "WITH_TRIAL" | "WITHOUT_TRIAL"
```

### Errores

No hay un tipo de error unificado a nivel de aplicación. Existe `MercadoPagoError` en el SDK de suscripciones. El resto usa `throw new Error()` con mensajes en español y `console.error()`.

## Flujo de suscripciones

```
Registro → Confirmación email → Onboarding (crea tienda) → /admin
  ↓
¿Trial usado? → NO → Plan CON trial (14 días gratis)
               → SÍ → Plan SIN trial (pago inmediato)
  ↓
Redirige a checkout de MP (subscripciones recurrentes)
  ↓
Webhook MP: authorized → subscription.status = 'active'
  ↓
Frontend: SubscriptionGuard verifica trial | subscription activa
  ↓
¿Suscripción vencida? → StoreSuspendedMessage en tienda pública
```

### Planes de MercadoPago

| Plan | Trial | Precio | ID |
|------|-------|--------|----|
| Con trial | 14 días | $48.000 ARS/mes | `NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID` |
| Sin trial | 0 días | $48.000 ARS/mes | `946bf6e3186741b5b7b8accbbdf646a5` |

## Integraciones externas

### MercadoPago

- **Checkout Pro**: Pagos one-time por pedido. Usa OAuth por tienda (tokens en `mp_accounts`) o token global de la app
- **Suscripciones Recurrentes**: Planes creados en MP, preaprobación por cliente, webhooks para actualización de estados
- **SDK**: `mercadopago` (npm) para server-side, `@mercadopago/sdk-react` para frontend (CardForm, Brick)
- **Webhooks**: Dos endpoints (`/api/webhook/mercadopago` y `/api/subscription/webhook`) para diferentes tipos de eventos

### WhatsApp

- **Operativo**: Links `wa.me` generados con mensaje pre-armado para notificaciones al dueño y confirmación al cliente
- **Documentado no operativo**: WhatsApp Cloud API (`graph.facebook.com/v20.0`) implementada en `WhatsAppService.sendCloudApiMessage()`. Requiere verificación business (no disponible actualmente)
- **Fallback**: Si Cloud API falla (falta de credenciales o error), devuelve link `wa.me`

## Servicios principales

| Servicio | Archivo | Responsabilidad |
|----------|---------|-----------------|
| `FoodyNowSubscriptionService` | `lib/services/subscription-service.ts` | CRUD de suscripciones, webhooks, sincronización con MP |
| `MercadoPagoSubscriptionsSDK` | `lib/payments/providers/mercadopago-subscriptions.ts` | Comunicación directa con API REST de MP |
| `mercadoPagoProvider` | `lib/payments/providers/mercadopago.ts` | Pagos one-time (Checkout Pro) |
| `WhatsAppService` | `lib/whatsapp/client.ts` | Notificaciones WhatsApp (wa.me + Cloud API) |
| `CartProvider` | `components/store/cart-context.tsx` | Estado del carrito en frontend (React Context) |
| `MercadoPagoSellerUtils` | `lib/mercadopago/` | Refresh de tokens, creación de preferencias |

## Restricciones globales para el agente de codeo

- Usar Next.js 15 App Router (no Pages Router)
- TypeScript estricto; evitar `any` cuando sea posible
- Tailwind CSS 4 para estilos; no CSS modules ni styled-components
- Preferir Server Components; solo usar "use client" cuando sea necesario (interactividad, hooks)
- Las operaciones de DB se hacen con Supabase client (server, browser o admin según contexto)
- Los precios siempre se manejan como `DECIMAL` / `number` en ARS
- No agregar dependencias sin aprobación explícita
- No crear stores globales (Redux, Zustand); usar React Context o Server Components
- Los archivos de utilidades van en `lib/`, componentes en `components/`, páginas en `app/`

## Decisiones congeladas

- Next.js 15 App Router como framework (no cambiable)
- Supabase como BaaS (no reemplazable)
- MercadoPago como único proveedor de pagos
- WhatsApp como único canal de notificaciones al cliente
- Sin superadmin ni panel de administración global
- Modelo de suscripción por tienda (no por usuario)
- Sin roles de empleado (solo owner + cliente)
- El pricing_config es JSONB en la DB, no tabla separada

## Pendientes arquitectónicos

- **Testing**: No se detectó framework de tests ni tests automatizados. Pendiente definir e implementar
- **Errores unificados**: No hay un tipo `AppError` o `Result<T, E>` común. Cada servicio maneja errores de forma distinta
- **Cola de WhatsApp**: `lib/queue/whatsapp-queue.ts` existe pero no se detectó un worker procesando la cola en producción
- **Scripts legacy**: Hay múltiples scripts JS `.js` sueltos en la raíz (diagnóstico, migraciones, fixes de suscripción). Son herramientas de una sola ejecución, no parte del sistema
- **user_subscriptions**: Tabla de un modelo anterior que ya no se usa. Pendiente de limpieza
- **Tabla subscription_usage**: Definida en DB pero sin uso activo en código

## Historial de cambios arquitectónicos

*(vacío en el documento inicial)*
