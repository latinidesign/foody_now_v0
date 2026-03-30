# 🗺️ DIAGRAMA VISUAL - Schema Supabase FoodyNow

**Fecha:** 29 de marzo de 2026  
**Propósito:** Entender visualmente la estructura de datos

---

## 📊 DIAGRAMA ER (ENTITY RELATIONSHIP)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          MODELO RELACIONAL COMPLETO                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                  auth.users (Supabase)
                                        │
                                        │ owner_id
                                        ▼
                    ┌───────────────────┴──────────────────┐
                    │                                      │
                    ▼                                      ▼
              ┌──────────────┐                       ┌──────────────────┐
              │    stores    │ (4 filas)             │ user_subscriptions│ 🔴
              │  PK: id      │                       │    (2 filas)      │ CONFLICTO
              │  UNIQUE:     │                       │  PK: id           │
              │  - slug      │                       │  FK: user_id      │
              │  - subdomain │                       └──────────────────┘
              └─────┬────────┘
                    │
         ┌──────────┼──────────────────┬──────────────┐
         │          │                  │              │
    1:M  │      1:1 │              1:M │          1:1 │
         │          │                  │              │
         ▼          ▼                  ▼              ▼
    ┌─────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────────────┐
    │categories│ │store_settings│ │  orders  │ │ subscriptions   │
    │PK: id    │ │PK: id        │ │PK: id    │ │PK: id          │
    │FK:store_id│ │FK:store_id   │ │FK:store_id│ │FK:store_id     │
    └─────┬────┘ │(1:1 UNIQUE)  │ └────┬─────┘ │FK:plan_id      │
          │      │              │      │       │1:M             │
      1:M │      │WhatsApp:     │  1:M │       │subscription_id │
          │      │- wa_phone    │      │       │                │
          ▼      │- wa_token    │      │       │stores.subs:    │
      ┌─────────┐│- wa_api      │      ▼       │- subscription_id│
      │products │└──────────────┘ ┌──────────┐│- subs_status   │
      │PK: id   │              │order_items│├─- subs_expires│
      │FK:store_id             │PK: id     ││                │
      │FK:category_id          │FK:order_id│└─────────────────┘
      └─────┬────┘              │FK:product │        │
            │                   │ id        │        │ 1:M
        1:M │              └──────────┘        │
            │              selected_options:   │
            ▼              (JSONB)             ▼
    ┌──────────────┐                  ┌──────────────────┐
    │product_options  │                │subscription_plans│
    │PK: id           │                │PK: id            │
    │FK:product_id    │                │name              │
    └─────┬───────────┘                │price             │
          │                            │duration_days     │
      1:M │                            │features (JSONB)  │
          │                            └──────────────────┘
          ▼
    ┌──────────────────────┐
    │product_option_values │
    │PK: id                │
    │FK:option_id          │
    │price_modifier        │
    └──────────────────────┘
```

---

## 🎯 TABLAS POR CATEGORÍA

### ✅ CORE E-COMMERCE (9 tablas - Críticas)

```
Core de pedidos y productos:
  ├─ stores (4 filas)
  │  └─ Contiene: Datos base de tienda, colores, logos, integración MP/WA
  │
  ├─ categories (múltiples)
  │  └─ Contiene: Categorías de productos por tienda
  │
  ├─ products (múltiples)
  │  └─ Contiene: Catálogo, precios, imágenes (gallery_images ARRAY)
  │
  ├─ product_options (pocas)
  │  └─ Contiene: Opciones de personalización (single/multiple)
  │
  ├─ product_option_values (pocas)
  │  └─ Contiene: Valores específicos de opciones
  │
  ├─ orders (122 filas)
  │  └─ Contiene: Pedidos completos con estado, entrega, pagos
  │
  ├─ order_items (múltiples)
  │  └─ Contiene: Detalles de cada ítem del pedido
  │
  ├─ store_settings (por tienda)
  │  └─ Contiene: Horarios, mensajes, configuración WA/MP
  │
  └─ payments (múltiples)
     └─ Contiene: Registro de pagos con provider (MP, Stripe, manual)
```

**Estado:** ✅ CRÍTICO - MANTENER INTACTO

---

### ✅ SUSCRIPCIONES (TIENDA) (3 tablas - Críticas)

```
Modelo de facturación por tienda:
  ├─ subscriptions (múltiples)
  │  └─ 1:1 con stores
  │  └─ Contiene: Estado (trial|active|expired|cancelled)
  │
  ├─ subscription_plans (3-5 planes)
  │  └─ Contiene: Planes (TIENDA NOW, etc)
  │  └─ Features en JSONB
  │
  └─ subscription_payments (múltiples)
     └─ Historial de pagos MP
```

**Estado:** ✅ CRÍTICO - MANTENER INTACTO

---

### 🆕 MERCADOPAGO OAUTH (1 tabla)

```
mp_accounts (pocas):
  └─ 1:1 con stores
  └─ Contiene: OAuth tokens de MP, access_token, refresh_token
  └─ Status: connected|revoked
```

**Estado:** ✅ IMPORTANTE - MANTENER INTACTO

---

### 🟡 PAGOS ADICIONALES (1 tabla revisable)

```
checkout_sessions (93 filas) - 10 MB ⚠️
  ├─ Tamaño: ENORME (107 KB por fila en promedio)
  ├─ Causas: JSONB pesados (preference_payload, items, order_data)
  ├─ Relación: FK a orders (nullable)
  ├─ Propósito: Historial de sesiones de checkout
  ├─ Alternativa: Migrar a orders.payment_metadata JSONB
  └─ Recomendación: DEPRECAR gradualmente o ARCHIVAR
```

**Estado:** 🟡 REVISAR - Candidata para deprecación

---

### ✅ NOTIFICACIONES (2 tablas)

```
Sistema de webhooks y notificaciones:
  ├─ push_subscriptions (pocas)
  │  └─ 1:1 con stores
  │  └─ Endpoints para Web Push
  │
  └─ whatsapp_webhook_events (auditoría)
     └─ Log de eventos de webhook WA
```

**Estado:** ✅ CORRECTO - MANTENER INTACTO

---

### 🔴 TABLAS MUERTAS (2 tablas - 0 filas cada una)

```
Nunca implementadas / Abandonadas:
  ├─ subscription_usage (0 filas)
  │  └─ Destinada a analytics - NUNCA SE LLENÓ
  │  └─ Recomendación: ELIMINAR INMEDIATO
  │
  └─ whatsapp_message_queue (0 filas)
     └─ Cola de mensajes WA - NUNCA SE IMPLEMENTÓ
     └─ Los mensajes se envían directamente vía API
     └─ Recomendación: ELIMINAR INMEDIATO
```

**Estado:** 🔴 ELIMINAR

---

### 🔴 TABLA CONFLICTIVA (1 tabla - REVISAR)

```
user_subscriptions (2 filas) - CONFLICTO DE MODELO
  └─ Competencia con subscriptions
  └─ Modelo por USUARIO vs modelo por TIENDA
  └─ 2 filas de datos históricos
  └─ Recomendación: INVESTIGAR Y ELIMINAR si no se usa
```

**Estado:** 🔴 ELIMINAR (condicionado a investigación)

---

## 📈 DIAGRAMA DE FLUJOS

### Flujo 1: COMPRA DE PRODUCTOS

```
Cliente en tienda
    │
    ├─ VE: products + product_options + product_option_values
    │
    ├─ CREA: order (customer_name, phone, address)
    │
    ├─ AGREGA: order_items (product + quantity + selected_options)
    │
    ├─ SELECCIONA: delivery_type (pickup|delivery)
    │
    ├─ PAGA: 
    │   ├─ checkout_sessions (sesión temporal)
    │   └─ payments (registro definitivo)
    │
    ├─ STORE NOTIFICADO:
    │  └─ store_notified_at
    │  └─ notification_status (JSONB)
    │
    └─ CLIENTE NOTIFICADO:
       └─ customer_notified_at
       └─ push_subscriptions + whatsapp_webhook_events
```

---

### Flujo 2: SUSCRIPCIÓN DE TIENDA

```
Nuevo store
    │
    ├─ INICIA: subscriptions (status='trial')
    │
    ├─ TRIAL DE: 15 días (trial_ends_at)
    │
    ├─ SI CONVIERTE:
    │   ├─ Selecciona: subscription_plans
    │   └─ Estado: status='active'
    │
    ├─ PAGO RECURRENTE:
    │   └─ subscription_payments (cada mes)
    │
    ├─ SINCRONIZACIÓN:
    │   └─ sync_store_subscription_status() trigger
    │   └─ Actualiza stores.subscription_status
    │   └─ Actualiza stores.subscription_expires_at
    │
    └─ RESULTADO EN stores:
       ├─ subscription_id
       ├─ subscription_status
       └─ subscription_expires_at
```

---

### Flujo 3: AUTENTICACIÓN MERCADOPAGO

```
Store owner cliquea: "Conectar con MP"
    │
    ├─ OAUTH: Redirige a MP
    │
    ├─ MP DEVUELVE: access_token + refresh_token
    │
    ├─ GUARDA EN: mp_accounts
    │  ├─ mp_user_id
    │  ├─ access_token
    │  ├─ refresh_token
    │  ├─ token_expires_at
    │  └─ status='connected'
    │
    ├─ USA PARA: 
    │   ├─ Crear preferencias de pago (orders)
    │   ├─ Crear preaprobaciones (subscriptions)
    │   └─ Consultar webhooks de pago
    │
    └─ WEBHOOK MP → /api/webhook/mercadopago
       ├─ Actualiza: orders.payment_status
       ├─ Actualiza: payments (registro)
       └─ Notifica a cliente
```

---

## 🔗 RELACIONES CRÍTICAS

### Relaciones 1:M (Uno a Muchos)

```
stores → categories           (1:M)
stores → products             (1:M)
stores → orders               (1:M)
stores → push_subscriptions   (1:1 pero en FK)
stores → whatsapp_webhook_events (1:M)

stores → subscriptions        (1:1 vía subscription_id)

categories → products         (1:M)
products → product_options    (1:M)
product_options → product_option_values (1:M)

orders → order_items          (1:M)
product → order_items         (1:M)

subscriptions → subscription_payments (1:M)
subscription_plans → subscription_payments (1:M)
```

### Relaciones ÚNICA (1:1)

```
stores ↔ store_settings     (UNIQUE: store_id)
stores ↔ subscriptions      (UNIQUE: store_id en FK)
stores ↔ push_subscriptions (UNIQUE: store_id)
stores ↔ mp_accounts        (UNIQUE: store_id)
```

---

## 📊 TAMAÑO RELATIVO

```
Tamaño en MB:

checkout_sessions    █████████████████████ 10 MB (107 KB/fila)
stores              ███████░░░░░░░░░░░░░░  4.4 MB (gallery + imágenes)
products            ██████░░░░░░░░░░░░░░░  3.8 MB (gallery + imágenes)
categories          ░░░ 280 KB
payments            ░░ 248 KB
subscriptions       ░░ 192 KB
store_settings      ░░ 128 KB
orders              ░░ 128 KB
subscription_payments ░░ 112 KB
order_items         ░░ 104 KB
(resto)             ░░░ ~96 KB cada una

TOTAL              ~28 MB (saludable para BD de negocio)
```

---

## 🎯 MATRIZ DE DECISIONES

```
┌─────────────────────────┬─────────┬─────────────┬──────────────┐
│ Tabla                   │ Filas   │ Riesgo      │ Decisión     │
├─────────────────────────┼─────────┼─────────────┼──────────────┤
│ subscription_usage      │ 0       │ ✅ BAJO     │ ❌ ELIMINAR  │
│ whatsapp_message_queue  │ 0       │ ✅ BAJO     │ ❌ ELIMINAR  │
│ user_subscriptions      │ 2       │ 🟡 MEDIO    │ 🔍 REVISAR   │
│ checkout_sessions       │ 93      │ 🟡 MEDIO    │ 🔄 DEPRECAR  │
│ stores.subdomain        │ 4       │ 🟡 BAJO     │ 🔍 REVISAR   │
│ trigger_sync (dup)      │ -       │ 🟡 BAJO     │ 🔍 REVISAR   │
│ (resto 14 tablas)       │ muchas  │ ✅ BAJO     │ ✅ MANTENER  │
└─────────────────────────┴─────────┴─────────────┴──────────────┘
```

---

## 🚀 ROADMAP DE LIMPIEZA

```
SEMANA 1:
  Day 1: ┌─ Investigación (30 min) ────────────────────┐
         │ grep en código, verificar uso               │
         └─────────────────────────────────────────────┘
         
  Day 2: ┌─ Documentación (20 min) ────────────────────┐
         │ Crear DECISIONES-LIMPIEZA-SCHEMA.md         │
         └─────────────────────────────────────────────┘
         
  Day 3: ┌─ Limpieza SEGURA (5 min) ──────────────────┐
         │ DROP subscription_usage                     │
         │ DROP whatsapp_message_queue                 │
         └─────────────────────────────────────────────┘

  Day 4: ┌─ Limpieza CONDICIONADA (15 min) ──────────┐
         │ DROP user_subscriptions (si decidiste)     │
         │ DROP stores.subdomain índice (si decidiste)│
         └─────────────────────────────────────────────┘

  Day 5: ┌─ Limpiar Scripts (10 min) ─────────────────┐
         │ mv scripts/old-notifications → deprecated/ │
         └─────────────────────────────────────────────┘

VALIDACIÓN:
  Day 5: ┌─ Validación (15 min) ──────────────────────┐
         │ Ejecutar queries de validación             │
         │ Comprobar que app funciona                 │
         │ Hacer commit                               │
         └─────────────────────────────────────────────┘

TOTAL TIEMPO: 95 minutos
```

---

## 🔐 MATRIZ DE RIESGO

```
                    Impacto
              Bajo      Medio     Alto
        ┌─────────────────────────────┐
    B   │  GREEN   │  YELLOW  │ RED   │
    a   │          │          │       │
    j   │ ✅ Seguro│ ⚠️ Revisar│ 🔴 NO│
    o   │          │          │       │
        ├─────────────────────────────┤
    M   │  YELLOW  │  ORANGE  │ RED   │
    e   │          │          │       │
    d   │ ⚠️ Revisar│⚠️⚠️ CUIDADO│ 🔴 NO│
    i   │          │          │       │
    o   ├─────────────────────────────┤
    A   │  RED     │  RED     │ 🔴 NO │
    l   │          │          │       │
    t   │  🔴 NO   │ 🔴 NO    │ 🔴 NO │
    o   │          │          │       │
        └─────────────────────────────┘

Tablas en este mapa:

subscription_usage       → Bajo/Bajo     ✅ ELIMINAR
whatsapp_message_queue  → Bajo/Bajo     ✅ ELIMINAR
user_subscriptions      → Medio/Medio   ⚠️ REVISAR
checkout_sessions       → Medio/Bajo    ⚠️ DEPRECAR
stores.subdomain        → Bajo/Bajo     ⚠️ REVISAR
```

---

## 📝 LEYENDA Y SÍMBOLOS

```
✅ = Seguro, bueno, correcto, mantener
🟡 = Atención, requiere revisión, investigar
🔴 = Crítico, problema, eliminar
🔍 = Investigar primero
🔄 = Deprecación gradual
⚠️ = Advertencia
🆕 = Nuevo
```

---

**Próxima acción:** Consulta `INDICE-DOCUMENTOS-AUDITORIA.md` para ver dónde encontrar más información
