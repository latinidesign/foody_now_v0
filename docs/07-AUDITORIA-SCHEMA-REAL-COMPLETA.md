# 📊 AUDITORÍA COMPLETA SCHEMA SUPABASE - FoodyNow
**Generado:** 29 de marzo de 2026  
**Datos:** Análisis real de queries ejecutadas en Supabase  
**Responsable:** Gustavo Latini

---

## 🎯 RESUMEN EJECUTIVO

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Tablas totales** | 20 | ⚠️ Requiere limpieza |
| **Tablas críticas (ecommerce)** | 9 | ✅ Óptimas |
| **Tablas de suscripción** | 7 | ✅ Óptimas |
| **Tablas de notificación** | 2 | ✅ Correctas |
| **Tablas de pago** | 2 | 🟡 Revisar |
| **Tablas potencialmente muertas** | 1 | 🔴 ELIMINAR |
| **Enums definidos** | 8 | ✅ Correctos |
| **Triggers activos** | 12 | ✅ Óptimos |
| **Funciones** | 12 | ✅ Óptimas |
| **Índices** | 80+ | ✅ Correctos |
| **Tamaño total BD** | ~28 MB | ✅ Saludable |

---

## 📈 ANÁLISIS DE DATOS

### Filas por tabla (información crítica):

```
checkout_sessions       → 93 filas    ✅ ACTIVA (datos históricos)
orders                  → 122 filas   ✅ CRÍTICA (pedidos)
stores                  → 4 filas     ✅ CRÍTICA (tiendas)
user_subscriptions      → 2 filas     🟡 PEQUEÑA (revisar uso)
subscription_usage      → 0 filas     🔴 TABLA MUERTA
whatsapp_message_queue  → 0 filas     🔴 TABLA MUERTA
```

---

## 🏗️ PARTE 1: TABLAS CORE ECOMMERCE (CRÍTICAS)

### ✅ Completamente Operativas

```
┌─ TABLA: stores
│  ├─ Filas: 4
│  ├─ Tamaño: 4.4 MB (MAYOR)
│  ├─ Relaciones: 
│  │  └─ FK: owner_id → auth.users
│  │  └─ FK: subscription_id → subscriptions (1:1)
│  ├─ Índices: 
│  │  ├─ stores_pkey (id)
│  │  ├─ stores_slug_key (UNIQUE)
│  │  ├─ stores_subdomain_idx (UNIQUE)
│  │  ├─ idx_stores_slug
│  │  ├─ idx_stores_owner
│  │  ├─ idx_stores_trial_used
│  │  ├─ idx_stores_subscription_status
│  │  └─ idx_stores_subscription_expires_at
│  ├─ Columnas: 29
│  │  ├─ id (UUID, PK)
│  │  ├─ owner_id (UUID, FK)
│  │  ├─ name (varchar)
│  │  ├─ slug (varchar, UNIQUE)
│  │  ├─ subdomain (text) ← DUPLICADA CON slug
│  │  ├─ logo_url, header_image_url, primary_color
│  │  ├─ phone, email, address
│  │  ├─ delivery_radius, delivery_fee, min_order_amount
│  │  ├─ is_active, is_onboarded, is_configured
│  │  ├─ subscription_id, subscription_status, subscription_expires_at
│  │  ├─ trial_used, trial_ends_at
│  │  ├─ whatsapp_message, extended_description, gallery_images
│  │  └─ timestamps (created_at, updated_at)
│  ├─ Uso en app: ⭐⭐⭐⭐⭐ (CRÍTICA)
│  └─ Status: ✅ MANTENER INTACTA
│
├─ TABLA: categories
│  ├─ Filas: (muchas)
│  ├─ Tamaño: 280 kB
│  ├─ FK: store_id → stores
│  ├─ Índices: 
│  │  ├─ categories_pkey
│  │  └─ idx_categories_store
│  ├─ Columnas: 9
│  │  ├─ id, store_id
│  │  ├─ name, description, image_url
│  │  ├─ sort_order, is_active
│  │  └─ timestamps
│  ├─ Triggers: update_categories_updated_at
│  ├─ Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
│  └─ Status: ✅ MANTENER INTACTA
│
├─ TABLA: products
│  ├─ Filas: (muchas)
│  ├─ Tamaño: 3.8 MB (GRANDE)
│  ├─ FKs: 
│  │  ├─ store_id → stores
│  │  └─ category_id → categories
│  ├─ Índices:
│  │  ├─ products_pkey
│  │  ├─ idx_products_store
│  │  └─ idx_products_category
│  ├─ Columnas: 13
│  │  ├─ id, store_id, category_id
│  │  ├─ name, description, price, sale_price
│  │  ├─ image_url, is_available, sort_order
│  │  ├─ gallery_images (ARRAY)
│  │  └─ timestamps
│  ├─ Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
│  └─ Status: ✅ MANTENER INTACTA
│
├─ TABLA: product_options
│  ├─ Filas: (pocas)
│  ├─ Tamaño: 40 kB
│  ├─ FK: product_id → products
│  ├─ Índices:
│  │  ├─ product_options_pkey
│  │  └─ idx_product_options_type
│  ├─ Columnas: 6
│  │  ├─ id, product_id
│  │  ├─ name, type, is_required
│  │  └─ created_at
│  ├─ Uso: ⭐⭐⭐ (IMPORTANTE)
│  └─ Status: ✅ MANTENER INTACTA
│
├─ TABLA: product_option_values
│  ├─ Filas: (pocas)
│  ├─ Tamaño: 24 kB
│  ├─ FK: option_id → product_options
│  ├─ Índices: product_option_values_pkey
│  ├─ Columnas: 5
│  │  ├─ id, option_id
│  │  ├─ name, price_modifier, sort_order
│  │  └─ created_at
│  ├─ Uso: ⭐⭐⭐ (IMPORTANTE)
│  └─ Status: ✅ MANTENER INTACTA
│
├─ TABLA: orders
│  ├─ Filas: 122 ✅ (Datos reales)
│  ├─ Tamaño: 128 kB
│  ├─ FK: store_id → stores
│  ├─ Índices:
│  │  ├─ orders_pkey
│  │  ├─ idx_orders_store
│  │  └─ idx_orders_status
│  ├─ Columnas: 18
│  │  ├─ id, store_id
│  │  ├─ customer_name, customer_phone, customer_email
│  │  ├─ delivery_type (ENUM), delivery_address, delivery_notes
│  │  ├─ subtotal, delivery_fee, total
│  │  ├─ status (ENUM), payment_status (ENUM), payment_id
│  │  ├─ estimated_delivery_time, notes
│  │  ├─ store_notified_at, customer_notified_at, notification_status (JSONB)
│  │  └─ timestamps
│  ├─ Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
│  └─ Status: ✅ MANTENER INTACTA
│
├─ TABLA: order_items
│  ├─ Filas: (muchas)
│  ├─ Tamaño: 104 kB
│  ├─ FKs:
│  │  ├─ order_id → orders
│  │  └─ product_id → products
│  ├─ Índices:
│  │  ├─ order_items_pkey
│  │  └─ idx_order_items_order
│  ├─ Columnas: 8
│  │  ├─ id, order_id, product_id
│  │  ├─ quantity, unit_price, total_price
│  │  ├─ selected_options (JSONB)
│  │  └─ created_at
│  ├─ Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
│  └─ Status: ✅ MANTENER INTACTA
│
└─ TABLA: store_settings
   ├─ Filas: (pocas)
   ├─ Tamaño: 128 kB
   ├─ FK: store_id → stores (UNIQUE 1:1)
   ├─ Índices:
   │  ├─ store_settings_pkey
   │  ├─ store_settings_store_id_key (UNIQUE)
   │  └─ idx_store_settings_wa_phone_number_id
   ├─ Columnas: 14
   │  ├─ id, store_id (UNIQUE)
   │  ├─ whatsapp_number, whatsapp_notifications_enabled, whatsapp_message
   │  ├─ mercadopago_access_token, mercadopago_public_key
   │  ├─ business_hours (JSONB), is_open
   │  ├─ welcome_message, order_confirmation_message
   │  ├─ wa_phone_number_id, wa_business_account_id, wa_access_token, wa_metadata
   │  ├─ wa_api_version
   │  └─ timestamps
   ├─ Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
   └─ Status: ✅ MANTENER INTACTA
```

---

## 💳 PARTE 2: TABLAS DE PAGOS

### 🟡 Análisis de checkout_sessions

```
TABLA: checkout_sessions
├─ Filas: 93 ✅ (DATOS REALES - IMPORTANTE)
├─ Tamaño: 10 MB (LA MAYOR - CONTIENE JSONB)
├─ FKs:
│  ├─ store_id → stores
│  └─ order_id → orders (nullable)
├─ Índices:
│  ├─ checkout_sessions_pkey
│  └─ checkout_sessions_external_reference_key (UNIQUE)
├─ Columnas: 18
│  ├─ id, external_reference (UNIQUE, UUID)
│  ├─ store_id, order_id (FK, nullable)
│  ├─ items (JSONB), order_data (JSONB)
│  ├─ subtotal, delivery_fee, total
│  ├─ preference_id, preference_payload (JSONB)
│  ├─ init_point
│  ├─ status (text: 'pending'|'completed'|etc)
│  ├─ payment_status (ENUM: pending|completed|failed|...)
│  ├─ payment_id, processed_at
│  └─ timestamps
├─ Propósito: Mantener sesiones de checkout con MercadoPago
├─ Patrón de uso:
│  ├─ Creada en: /api/checkout/create-session
│  ├─ Actualizada en: Webhook MP (/api/webhook/mercadopago)
│  ├─ Leída en: /api/checkout/get-session, success/failure pages
├─ ⚠️ OBSERVACIÓN CRÍTICA:
│  └─ 93 filas = Histórico completo desde lanzamiento
│  └─ 10 MB por JSONB (preference_payload, items, order_data)
│  └─ MÁS GRANDE que TODA la tabla orders (122 filas = 128 kB)
│
├─ OPCIONES:
│  1️⃣ MANTENER: Si necesitas historial de todas las sesiones
│  2️⃣ DEPRECAR: Migrar campos a orders + payments, borrar checkout_sessions
│  3️⃣ COMPRIMIR: Archivar a tabla histórica separada
│
└─ RECOMENDACIÓN: 🟡 DEPRECAR (migrar a orders.payment_metadata JSONB)
   Razón: Duplica datos de orders + payments, ocupa 10x más espacio
```

### ✅ TABLA: payments

```
TABLA: payments
├─ Filas: (muchas)
├─ Tamaño: 248 kB
├─ FKs:
│  ├─ order_id → orders
│  └─ store_id → stores
├─ Índices:
│  ├─ payments_pkey
│  ├─ payments_order_id_idx
│  ├─ payments_store_id_idx
│  ├─ payments_mp_payment_id_idx
│  ├─ payments_provider_idx
│  ├─ payments_provider_provider_payment_id_key (UNIQUE)
│  └─ payments_provider_provider_payment_id_unique (parcial)
├─ Columnas: 18
│  ├─ id, order_id (FK), store_id (FK)
│  ├─ provider (ENUM: mercadopago|stripe|manual)
│  ├─ provider_payment_id, mp_payment_id
│  ├─ preference_id, payment_method
│  ├─ status (text), status_detail
│  ├─ transaction_amount, currency
│  ├─ payer_email, collector_id, source_type
│  ├─ metadata (JSONB), raw (JSONB)
│  └─ timestamps
├─ Propósito: Registro definitivo de pagos
├─ Uso: ⭐⭐⭐⭐⭐ (CRÍTICA para auditoría)
├─ Triggers: trg_touch_payments (UPDATE)
└─ Status: ✅ MANTENER INTACTA
```

### 🆕 TABLA: mp_accounts

```
TABLA: mp_accounts
├─ Filas: (pocas)
├─ Tamaño: 96 kB
├─ FK: store_id → stores
├─ Índices:
│  ├─ mp_accounts_pkey
│  ├─ mp_accounts_store_unique
│  ├─ mp_accounts_mp_user_unique
│  ├─ idx_mp_accounts_store_id
│  └─ idx_mp_accounts_mp_user_id
├─ Columnas: 13
│  ├─ id, store_id (FK, UNIQUE)
│  ├─ mp_user_id, access_token, refresh_token
│  ├─ token_expires_at, scope, public_key
│  ├─ status (text: 'connected'|'revoked')
│  ├─ connected_at, revoked_at
│  ├─ raw (JSONB) - respuesta completa MP
│  └─ timestamps
├─ Propósito: Almacenar OAuth tokens de MercadoPago
├─ Uso: ⭐⭐⭐⭐ (IMPORTANTE para MP OAuth)
├─ Triggers: trg_mp_accounts_updated_at
└─ Status: ✅ MANTENER INTACTA
```

---

## 📬 PARTE 3: TABLAS DE NOTIFICACIONES

### ✅ TABLA: push_subscriptions

```
TABLA: push_subscriptions
├─ Filas: (pocas)
├─ Tamaño: 80 kB
├─ FK: store_id → stores
├─ Índices:
│  ├─ push_subscriptions_pkey
│  ├─ push_subscriptions_store_id_key (UNIQUE)
│  └─ idx_push_subscriptions_endpoint
├─ Columnas: 7
│  ├─ id, store_id (FK, UNIQUE)
│  ├─ endpoint, p256dh_key, auth_key
│  └─ timestamps
├─ Propósito: Suscripciones Web Push
├─ Uso: ⭐⭐ (Notificaciones push)
├─ Triggers: update_push_subscriptions_updated_at
└─ Status: ✅ MANTENER INTACTA
```

### ✅ TABLA: whatsapp_webhook_events

```
TABLA: whatsapp_webhook_events
├─ Filas: (pocas)
├─ Tamaño: 48 kB
├─ FK: store_id → stores
├─ Índices: whatsapp_webhook_events_pkey
├─ Columnas: 8
│  ├─ id, store_id (FK)
│  ├─ phone_number_id, entry_id, change_field
│  ├─ payload (JSONB, NOT NULL)
│  ├─ processed (boolean)
│  └─ created_at
├─ Propósito: Log de eventos webhook de WhatsApp
├─ Uso: ⭐⭐ (Auditoría de webhooks)
└─ Status: ✅ MANTENER INTACTA
```

### 🔴 TABLA: whatsapp_message_queue (MUERTA)

```
TABLA: whatsapp_message_queue
├─ Filas: 0 ❌ (VACÍA - MUERTA)
├─ Tamaño: 64 kB
├─ FKs:
│  ├─ store_id → stores
│  └─ order_id → orders (nullable)
├─ Índices: whatsapp_message_queue_pkey
├─ Columnas: 16
│  ├─ id, job_id, store_id (FK), order_id (FK)
│  ├─ message_type, recipient_phone, message_content
│  ├─ template_data (JSONB), status, attempts, max_attempts
│  ├─ scheduled_at, processed_at, failed_at, error_message
│  └─ timestamps
├─ Propósito: Cola de mensajes WhatsApp (NUNCA IMPLEMENTADO)
├─ Uso: ❌ NINGUNO EN CÓDIGO
├─ Triggers: update_whatsapp_queue_updated_at (INÚTIL)
├─ ¿Está documentada?: Sí, en whatsapp-queue-implementation.md (pero no usada)
│
└─ Status: 🔴 ELIMINAR
   Razón: 0 filas, no hay código que la use, toma espacio innecesario
   Alternativa: Los mensajes WA se envían directamente vía API
```

---

## 💰 PARTE 4: TABLAS DE SUSCRIPCIONES (TIENDAS)

### ✅ TABLA: subscriptions (Por tienda)

```
TABLA: subscriptions
├─ Filas: (muchas)
├─ Tamaño: 192 kB
├─ FKs:
│  ├─ store_id → stores (FK, UNIQUE)
│  └─ plan_id → subscription_plans
├─ Índices: subscriptions_pkey (solo PK)
├─ Columnas: 17
│  ├─ id, store_id (FK, UNIQUE), plan_id (FK)
│  ├─ status (ENUM: trial|active|expired|cancelled|...)
│  ├─ trial_started_at, trial_ends_at
│  ├─ paid_started_at, paid_ends_at
│  ├─ mercadopago_subscription_id, mercadopago_preapproval_id
│  ├─ auto_renewal, cancelled_at, cancellation_reason
│  ├─ next_billing_date, last_payment_date
│  ├─ user_id, plan_name
│  ├─ metadata (JSONB)
│  └─ timestamps
├─ Triggers: 
│  ├─ sync_store_subscription_after_insert
│  ├─ sync_store_subscription_after_update
│  ├─ trigger_sync_subscription_status
│  ├─ subscriptions_updated_at
├─ Propósito: Modelo de suscripción POR TIENDA
├─ Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
└─ Status: ✅ MANTENER INTACTA
```

### ✅ TABLA: subscription_plans

```
TABLA: subscription_plans
├─ Filas: (pocas, 3-5 planes)
├─ Tamaño: 32 kB
├─ Índices: subscription_plans_pkey
├─ Columnas: 13
│  ├─ id, name, display_name
│  ├─ description, price, currency, frequency (ENUM)
│  ├─ duration_days, is_active
│  ├─ features (JSONB), max_products, max_orders_per_month
│  ├─ priority, discount
│  └─ timestamps
├─ Triggers: subscription_plans_updated_at
├─ Propósito: Definición de planes de suscripción
├─ Uso: ⭐⭐⭐⭐ (MUY IMPORTANTE)
└─ Status: ✅ MANTENER INTACTA
```

### ✅ TABLA: subscription_payments

```
TABLA: subscription_payments
├─ Filas: (muchas)
├─ Tamaño: 112 kB
├─ FKs:
│  ├─ subscription_id → subscriptions
│  └─ plan_id → subscription_plans
├─ Índices:
│  ├─ subscription_payments_pkey
│  ├─ subscription_payments_mercadopago_payment_id_key (UNIQUE)
│  ├─ idx_subscription_payments_subscription_id
│  ├─ idx_subscription_payments_payment_date
│  ├─ idx_subscription_payments_status
│  └─ idx_subscription_payments_mercadopago_payment_id
├─ Columnas: 20
│  ├─ id, subscription_id (FK), plan_id (FK)
│  ├─ amount, currency, status (ENUM)
│  ├─ mercadopago_payment_id, mercadopago_preference_id
│  ├─ mercadopago_merchant_order_id
│  ├─ payment_date, due_date, processed_at
│  ├─ period_start, period_end (período de suscripción)
│  ├─ billing_period_start, billing_period_end
│  ├─ payment_method, payer_email, external_reference
│  ├─ metadata (JSONB)
│  └─ timestamps
├─ Triggers: subscription_payments_updated_at
├─ Propósito: Registro de pagos de suscripciones
├─ Uso: ⭐⭐⭐⭐ (CRÍTICA para auditoría)
└─ Status: ✅ MANTENER INTACTA
```

### 🔴 TABLA: subscription_usage (MUERTA)

```
TABLA: subscription_usage
├─ Filas: 0 ❌ (VACÍA - MUERTA)
├─ Tamaño: 40 kB
├─ FK: subscription_id → subscriptions
├─ Índices: subscription_usage_pkey
├─ Columnas: 11
│  ├─ id, subscription_id (FK)
│  ├─ period_start, period_end
│  ├─ products_count, orders_count, api_calls_count, storage_used_mb
│  ├─ metadata (JSONB)
│  └─ timestamps
├─ Triggers: subscription_payments_updated_at (HEREDADO)
├─ Propósito: Usar para analytics de uso por tienda
├─ Uso: ❌ NINGUNO EN CÓDIGO
├─ ¿Está documentada?: No
│
└─ Status: 🔴 ELIMINAR
   Razón: 0 filas, tabla nunca se llenó
   Alternativa: Si necesitas analytics, crear tabla aparte: analytics_usage_logs
```

---

## 👤 PARTE 5: TABLA DE SUSCRIPCIONES (USUARIO) - CONFLICTIVA

### 🔴 TABLA: user_subscriptions (REDUNDANTE)

```
TABLA: user_subscriptions
├─ Filas: 2 (POCO DATOS)
├─ Tamaño: 96 kB (MÁS GRANDE QUE user_subscriptions CON 2 FILAS)
├─ FK: user_id → auth.users (NO HAN VALIDADO FK)
├─ Índices: user_subscriptions_pkey
├─ Columnas: 17
│  ├─ id, user_id (FK, NO VALIDADA)
│  ├─ created_at, updated_at (NOT NULL)
│  ├─ mercadopago_subscription_id, mercadopago_preapproval_id
│  ├─ mercadopago_payer_id
│  ├─ status (text: 'pending'|...)
│  ├─ plan_id (text: 'premium'), price (48900), currency ('ARS')
│  ├─ trial_start_date, trial_end_date
│  ├─ subscription_start_date, next_payment_date
│  ├─ cancelled_at, auto_renewal, payment_method_id
├─ Triggers: update_user_subscriptions_updated_at (INÚTIL)
├─ Propósito: ⚠️ ALTERNATIVA A subscriptions (CONFLICTIVA)
│
├─ ⚠️ PROBLEMA CRÍTICO:
│  └─ Existen DOS modelos de suscripción simultáneamente:
│     1. subscriptions → por TIENDA (correcto, en uso)
│     2. user_subscriptions → por USUARIO (alternativo, dudoso)
│
│  Conflictos potenciales:
│  ├─ ¿Un usuario paga suscripción GLOBAL o POR TIENDA?
│  ├─ ¿Cómo se sincroniza? (No hay trigger que lo haga)
│  ├─ 2 filas en user_subscriptions vs many en subscriptions
│  ├─ Código puede estar consultando la tabla equivocada
│
├─ Scripts que la crean:
│  ├─ scripts/create-user-subscriptions-table.sql
│  └─ scripts/add-trial-support.sql
│
└─ Status: 🔴 ELIMINAR O DEPRECAR
   Decisión requerida:
   ├─ Si SÍ se usa: documentar dónde, validar FKs, sincronizar
   └─ Si NO se usa: eliminar + archivar scripts
```

---

## 🔤 PARTE 6: ENUMS (TIPOS)

### ✅ Todos definidos correctamente

```sql
1. delivery_type
   Valores: pickup, delivery
   Ubicación: orders.delivery_type
   Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
   Status: ✅ CORRECTO

2. order_status
   Valores: pending, confirmed, preparing, ready, sent, delivered, cancelled
   Ubicación: orders.status
   Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
   Status: ✅ CORRECTO

3. payment_status
   Valores: pending, completed, failed, refunded, approved, rejected, cancelled, in_process
   Ubicación: orders.payment_status, checkout_sessions.payment_status
   Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
   Status: ✅ CORRECTO

4. payment_frequency
   Valores: monthly, yearly, one_time, quarterly
   Ubicación: subscription_plans.frequency
   Uso: ⭐⭐ (IMPORTANTE)
   Status: ✅ CORRECTO

5. providers
   Valores: mercadopago, stripe, manual
   Ubicación: payments.provider
   Uso: ⭐⭐⭐ (IMPORTANTE para multi-provider)
   Status: ✅ CORRECTO

6. subscription_payment_status
   Valores: pending, approved, rejected, refunded, cancelled
   Ubicación: subscription_payments.status
   Uso: ⭐⭐⭐ (IMPORTANTE)
   Status: ✅ CORRECTO

7. subscription_status
   Valores: trial, active, expired, cancelled, suspended, past_due, pending, post_due
   Ubicación: subscriptions.status, stores.subscription_status
   Uso: ⭐⭐⭐⭐⭐ (CRÍTICA)
   Status: ✅ CORRECTO

RECOMENDACIÓN: Mantener todos los ENUMS
```

---

## ⚙️ PARTE 7: TRIGGERS Y FUNCIONES

### Triggers (12 activos)

```
✅ TRIGGERS IMPORTANTES:

1. update_categories_updated_at (UPDATE categories)
   └─ Función: update_updated_at_column()
   Status: ✅ MANTENER

2. sync_store_subscription_after_insert (INSERT subscriptions)
   └─ Función: sync_store_subscription_status()
   Propósito: Sincroniza stores.subscription_status cuando se crea suscripción
   Status: ✅ CRÍTICA - MANTENER

3. sync_store_subscription_after_update (UPDATE subscriptions)
   └─ Función: sync_store_subscription_status()
   Propósito: Mantiene sincronizado stores.subscription_* cuando cambia suscripción
   Status: ✅ CRÍTICA - MANTENER

4. trigger_sync_subscription_status (UPDATE subscriptions)
   └─ Función: sync_store_subscription_status()
   ⚠️ DUPLICADO: Mismo trigger que #3 (revisar)
   Status: 🟡 POSIBLE DUPLICADO

5. subscriptions_updated_at (UPDATE subscriptions)
   └─ Función: update_subscription_updated_at()
   Status: ✅ MANTENER

6. subscription_payments_updated_at (UPDATE subscription_payments)
   └─ Función: update_subscription_updated_at()
   Status: ✅ MANTENER

7. subscription_plans_updated_at (UPDATE subscription_plans)
   └─ Función: update_subscription_updated_at()
   Status: ✅ MANTENER

8. trg_mp_accounts_updated_at (UPDATE mp_accounts)
   └─ Función: set_updated_at()
   Status: ✅ MANTENER

9. trg_touch_payments (UPDATE payments)
   └─ Función: touch_updated_at()
   Status: ✅ MANTENER

10. update_push_subscriptions_updated_at (UPDATE push_subscriptions)
    └─ Función: update_push_subscriptions_updated_at()
    Status: ✅ MANTENER

11. update_user_subscriptions_updated_at (UPDATE user_subscriptions)
    └─ Función: update_user_subscriptions_updated_at()
    Status: 🔴 ELIMINAR si se elimina user_subscriptions

12. update_whatsapp_queue_updated_at (UPDATE whatsapp_message_queue)
    └─ Función: update_whatsapp_queue_updated_at()
    Status: 🔴 ELIMINAR si se elimina whatsapp_message_queue

RECOMENDACIÓN:
├─ Mantener: triggers 1-10
├─ Revisar: duplicado en #4
└─ Eliminar: triggers 11-12 cuando elimines tablas
```

### Funciones (12 activas)

```
✅ FUNCIONES IMPORTANTES:

1. update_updated_at_column()
   └─ Trigger function: actualiza timestamp
   Status: ✅ MANTENER

2. set_updated_at()
   └─ Trigger function: variante de update_updated_at
   Status: ✅ MANTENER

3. touch_updated_at()
   └─ Trigger function: otra variante
   Status: ✅ MANTENER

4. sync_store_subscription_status()
   └─ Trigger function: CRÍTICA - sincroniza suscripciones
   Status: ✅ CRÍTICA - MANTENER

5. update_subscription_updated_at()
   └─ Trigger function: actualiza timestamp en suscripciones
   Status: ✅ MANTENER

6. update_push_subscriptions_updated_at()
   └─ Trigger function: para push_subscriptions
   Status: ✅ MANTENER

7. update_user_subscriptions_updated_at()
   └─ Trigger function: para user_subscriptions
   Status: 🔴 ELIMINAR SI se elimina user_subscriptions

8. update_whatsapp_queue_updated_at()
   └─ Trigger function: para whatsapp_message_queue
   Status: 🔴 ELIMINAR SI se elimina whatsapp_message_queue

9. cleanup_expired_trials()
   └─ Función manual: limpia trials expirados
   Status: ✅ MANTENER (crítica para auditoría)

10. get_subscription_days_left()
    └─ Función: calcula días restantes
    Status: ✅ MANTENER

11. is_subscription_active() [x2 definiciones]
    └─ Función: verifica si está activa
    Status: ✅ MANTENER (pero revisar si hay duplicado)

12. (x2 is_subscription_active)
    └─ ⚠️ DUPLICADA - revisar

RECOMENDACIÓN:
├─ Mantener: funciones 1-6, 9-10
├─ Revisar: duplicados en is_subscription_active
└─ Eliminar: 7-8 cuando elimines tablas
```

---

## 🔗 PARTE 8: ÍNDICES

### Resumen de índices (80+)

```
✅ Índices CRÍTICOS:

Primary Keys (20): Cada tabla tiene su PK - ✅ MANTENER

UNIQUE Indexes:
├─ stores_slug_key (UNIQUE slug)
├─ stores_subdomain_idx (UNIQUE subdomain) ⚠️ DUPLICADO CON slug
├─ store_settings_store_id_key (UNIQUE 1:1)
├─ push_subscriptions_store_id_key (UNIQUE 1:1)
├─ checkout_sessions_external_reference_key
├─ mp_accounts_store_unique
├─ mp_accounts_mp_user_unique
├─ payments_provider_provider_payment_id_key
├─ subscription_payments_mercadopago_payment_id_key
└─ Status: ✅ CORRECTOS

Foreign Key Indexes (24):
└─ Todos correctos - Status: ✅ MANTENER

Performance Indexes:
├─ idx_orders_store (búsquedas por tienda)
├─ idx_orders_status (búsquedas por estado)
├─ idx_stores_owner (búsquedas por propietario)
├─ idx_stores_subscription_status (búsquedas por estado suscripción)
├─ idx_stores_subscription_expires_at (queries de expiración)
├─ idx_stores_trial_used (trial cleanup)
├─ idx_products_store, idx_products_category
├─ idx_categories_store
├─ idx_product_options_type
├─ idx_payment_methods (varios índices de payments)
├─ idx_subscription_payments_payment_date
├─ idx_subscription_payments_status
└─ Status: ✅ OPTIMIZADOS

RECOMENDACIÓN:
├─ Todos los índices están correctamente definidos
├─ Considerar revisión: stores_subdomain_idx vs stores_slug_key (posible redundancia)
└─ Mantener intactos: todos los demás
```

---

## 📊 PARTE 9: ESTADÍSTICAS DE ESPACIO

```
Tamaño total de BD: ~28 MB

Top 5 tablas por tamaño:
1. checkout_sessions    10 MB  (93 filas)    ❌ MUY GRANDE
2. stores               4.4 MB (4 filas)     ✅ OK (gallery_images JSONB)
3. products             3.8 MB (many)        ✅ OK (gallery_images ARRAY)
4. categories           280 kB (many)        ✅ OK
5. payments             248 kB (many)        ✅ OK

Observación:
└─ checkout_sessions es 10x más grande por filas
   └─ 93 filas = 10 MB
   └─ checkout_sessions es un almacén de JSONB pesado
   └─ 122 órdenes reales = 128 kB (80x más eficiente)

Tablas vacías:
├─ subscription_usage (0 filas, 40 kB)
└─ whatsapp_message_queue (0 filas, 64 kB)
```

---

## 🎯 PARTE 10: RESUMEN DE DECISIONES

### ✅ MANTENER (13 tablas)

```
Core ecommerce (9):
1. stores
2. categories
3. products
4. product_options
5. product_option_values
6. orders
7. order_items
8. store_settings
9. payments

Notificaciones (2):
10. push_subscriptions
11. whatsapp_webhook_events

Suscripciones (2):
12. subscriptions
13. subscription_plans
14. subscription_payments (3 en realidad)

Pagos (1):
15. mp_accounts
```

### 🟡 DEPRECAR (1 tabla)

```
checkout_sessions
├─ Razón: 10 MB de JSONB, duplica datos de orders + payments
├─ Acción: Migrar campos a orders.payment_metadata JSONB
├─ Timeline: Gradual, mantener para historial
└─ No eliminar inmediatamente
```

### 🔴 ELIMINAR (3 tablas)

```
1. subscription_usage
   ├─ Filas: 0
   ├─ Razón: Nunca se usó
   └─ Riesgo: BAJO

2. whatsapp_message_queue
   ├─ Filas: 0
   ├─ Razón: Nunca se implementó
   └─ Riesgo: BAJO

3. user_subscriptions (REVISAR)
   ├─ Filas: 2
   ├─ Razón: Conflicta con subscriptions
   ├─ Acción: Verificar si se usa en código
   └─ Riesgo: MEDIO (tiene 2 filas)
```

### 🔍 REVISAR (1 tabla)

```
user_subscriptions
├─ Preguntas:
│  ├─ ¿Se usa en /api/subscription/* endpoints?
│  ├─ ¿Hay código que la consulta?
│  ├─ ¿Los 2 registros son históricos o activos?
│  └─ ¿Debería ser migrado a subscriptions?
├─ Búsqueda recomendada: grep -r "user_subscriptions" app/
└─ Decisión: Después de búsqueda en código
```

---

## 📋 PARTE 11: SCRIPTS SQL DUPLICADOS

### Archivos relacionados con notificaciones (6 variantes):

```
1. scripts/create-notifications-tables.sql
   └─ ✅ VERSIÓN CONSOLIDADA (MANTENER)

2. scripts/setup-complete-notifications-v1.sql
   └─ 🔴 VIEJA (ARCHIVAR en /scripts/deprecated/)

3. scripts/setup-complete-notifications-v2.sql
   └─ 🔴 VIEJA (ARCHIVAR)

4. scripts/setup-notifications-clean.sql
   └─ 🔴 VIEJA (ARCHIVAR)

5. scripts/add-notifications-tables.sql
   └─ 🔴 VIEJA (ARCHIVAR)

6. scripts/setup-complete-notifications-custom.sql
   └─ 🔴 VIEJA (ARCHIVAR)

ACCIÓN: Mover archivos 2-6 a scripts/deprecated/
```

### Archivos de suscripciones:

```
1. scripts/subscription-system.sql
   └─ ✅ CANÓNICA (MANTENER)

2. scripts/create-user-subscriptions-table.sql
   └─ 🟡 REVISAR (usa user_subscriptions - pendiente decisión)

3. scripts/add-trial-support.sql
   └─ 🟡 REVISAR (relacionada con user_subscriptions)
```

---

## ⚠️ PARTE 12: PROBLEMAS Y RECOMENDACIONES

### Problemas encontrados:

```
1. ❌ stores.subdomain vs stores.slug
   └─ Ambos con índice UNIQUE
   └─ ¿Cuál se usa? (revisar código)
   └─ Posible redundancia

2. ❌ checkout_sessions ocupa 10x espacio
   └─ 93 filas = 10 MB (vs orders: 122 filas = 128 kB)
   └─ JSONB muy pesado
   └─ Considerar deprecación

3. ❌ trigger duplicado: sync_store_subscription_after_update + trigger_sync_subscription_status
   └─ Ambos en subscriptions UPDATE
   └─ Mismo objetivo
   └─ Revisar si necesarios

4. ❌ user_subscriptions conflictúa con subscriptions
   └─ Dos modelos de suscripción simultáneos
   └─ 2 filas vs many filas
   └─ Requiere investigación

5. ⚠️ subscription_usage vacía
   └─ 0 filas, table muerta
   └─ Nunca se llenó
   └─ Eliminar seguro

6. ⚠️ whatsapp_message_queue vacía
   └─ 0 filas, table muerta
   └─ Implementación planificada pero nunca completada
   └─ Eliminar seguro
```

### Recomendaciones:

```
INMEDIATO (sin riesgo):
✅ Eliminar subscription_usage (0 filas, nunca usada)
✅ Eliminar whatsapp_message_queue (0 filas, nunca usada)
✅ Archivar scripts de notificaciones duplicados

CORTO PLAZO (investigar primero):
🟡 Revisar user_subscriptions (buscar en código)
🟡 Revisar stores.subdomain vs stores.slug (documentar cuál usar)
🟡 Revisar triggers duplicados en subscriptions

MEDIANO PLAZO:
🟡 Considerar deprecación gradual de checkout_sessions
🟡 Migrar checkout_sessions → orders.payment_metadata JSONB

LARGO PLAZO:
📊 Implementar analytics_logs si se necesita subscription_usage
```

---

## 📑 APÉNDICE: QUERIES PARA VALIDAR

```sql
-- Verificar uso de subdomain
SELECT * FROM stores WHERE subdomain IS NOT NULL;

-- Verificar checkout_sessions en uso
SELECT COUNT(*) FROM checkout_sessions WHERE order_id IS NOT NULL;

-- Verificar user_subscriptions en uso
SELECT * FROM user_subscriptions;

-- Verificar triggers duplicados
SELECT trigger_name, event_object_table 
FROM information_schema.triggers
WHERE event_object_table = 'subscriptions'
GROUP BY trigger_name, event_object_table;

-- Buscar referencias en código a user_subscriptions
-- En terminal: grep -r "user_subscriptions" app/ lib/ scripts/

-- Buscar referencias a whatsapp_message_queue
-- En terminal: grep -r "whatsapp_message_queue" app/ lib/ scripts/
```

---

## 📋 CHECKLIST DE AUDITORÍA

- [ ] Ejecutar queries de validación (Apéndice)
- [ ] Buscar user_subscriptions en código (grep)
- [ ] Buscar whatsapp_message_queue en código (grep)
- [ ] Revisar stores.subdomain vs stores.slug (documentar)
- [ ] Revisar triggers duplicados en subscriptions
- [ ] Decidir: ¿Mantener o eliminar user_subscriptions?
- [ ] Decidir: ¿Deprecar checkout_sessions?
- [ ] Crear carpeta scripts/deprecated/
- [ ] Mover scripts de notificaciones antiguos a deprecated/
- [ ] Actualizar README con recomendaciones
- [ ] Crear plan de limpieza fase por fase

---

**Documento generado:** 29 de marzo de 2026  
**Próximas acciones:** Revisar puntos de investigación y ejecutar limpieza gradual
