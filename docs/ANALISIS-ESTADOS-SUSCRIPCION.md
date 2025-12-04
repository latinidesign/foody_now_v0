# Análisis Exhaustivo: Estados de Suscripción MercadoPago

## 📊 Estados de MercadoPago (API Preapproval)

Según la documentación de MercadoPago para Preapproval/Suscripciones:

### Estados del objeto `preapproval`:

| Estado MP | Descripción | Cuándo ocurre |
|-----------|-------------|---------------|
| `pending` | Pendiente de autorización | Suscripción creada, esperando confirmación de pago/tarjeta |
| `authorized` | Autorizada | Pago procesado exitosamente, suscripción activa |
| `paused` | Pausada | Usuario o merchant pausó la suscripción |
| `cancelled` | Cancelada | Usuario o merchant canceló definitivamente |

### Eventos de Webhook (`subscription_preapproval`):

Los webhooks notifican cambios en el estado de la preapproval:
- `preapproval.created` - Suscripción creada
- `preapproval.updated` - Cambio de estado
- `preapproval.deleted` - Suscripción eliminada

---

## 🎯 Mapeo Requerido FoodyNow

### Estados Internos Requeridos:

| Estado Interno | Label UI | Descripción | Origen |
|----------------|----------|-------------|--------|
| `pending` | "Pendiente de pago" | Suscripción iniciada, pago no confirmado | MP: `pending` o pago fallido |
| `trial` | "Activo en período de prueba" | En trial gratuito (30 días) | Creación local + MP aún no cobra |
| `active` | "Activo con pago al día" | Pago procesado, suscripción activa | MP: `authorized` |
| `past_due` | "Suspendido por falta de pago" | Pago vencido, gracia de X días | MP: pago rechazado |
| `suspended` | "Pausada" | Pausada por usuario/merchant | MP: `paused` |
| `cancelled` | "Suscripción Cancelada" | Cancelada definitivamente | MP: `cancelled` o usuario |
| `expired` | "Expirada" | Trial terminado sin pago | Local: trial_ends_at < now |

---

## ❌ Problemas Identificados

### 1. Mapeo Incorrecto en Webhook (`app/api/webhooks/mercadopago/route.ts`)

**Actual (INCORRECTO):**
```typescript
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'authorized':
      return 'active'  // ✅ Correcto
    case 'pending':
      return 'trial'   // ❌ INCORRECTO - debería ser 'pending'
    case 'paused':
      return 'suspended' // ✅ Correcto
    case 'cancelled':
      return 'cancelled' // ✅ Correcto
    default:
      return 'pending'
  }
}
```

**Error:** Cuando MercadoPago reporta `pending` (pago no procesado), el sistema asigna `trial` en lugar de `pending`.

### 2. Creación con Estado `trial` Prematuro

En `app/api/subscription/create/route.ts` y `lib/services/subscription-service.ts`:

```typescript
// Se asigna 'trial' ANTES de confirmar el pago
status: "trial"
```

**Error:** Si el pago falla, la tienda queda con estado `trial` cuando debería ser `pending`.

### 3. Enum de Base de Datos Incompleto

El enum `subscription_status` en PostgreSQL **NO incluye `pending`**:

```sql
CREATE TYPE subscription_status AS ENUM (
  'trial',      -- ✅
  'active',     -- ✅
  'expired',    -- ✅
  'cancelled',  -- ✅
  'suspended'   -- ✅
  -- ❌ FALTA: 'pending'
  -- ❌ FALTA: 'past_due'
);
```

### 4. Inconsistencia entre TypeScript y Base de Datos

`lib/types/subscription.ts`:
```typescript
export type SubscriptionStatus = 'trial' | 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended' | 'past_due'
```

TypeScript tiene `pending` y `past_due`, pero el enum de DB no los soporta.

---

## ✅ Solución Propuesta

### Paso 1: Actualizar Enum en PostgreSQL

```sql
-- Agregar valores faltantes al enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'past_due';
```

### Paso 2: Corregir Mapeo en Webhook

```typescript
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'authorized':
      return 'active'     // Pago confirmado
    case 'pending':
      return 'pending'    // Esperando confirmación de pago
    case 'paused':
      return 'suspended'  // Pausada
    case 'cancelled':
      return 'cancelled'  // Cancelada
    default:
      return 'pending'    // Estado desconocido = pendiente
  }
}
```

### Paso 3: Flujo Correcto de Creación

```
1. Usuario inicia suscripción
2. Crear suscripción local con status = 'pending'
3. Redirigir a MercadoPago
4. Webhook recibe confirmación:
   - Si authorized → cambiar a 'trial' o 'active'
   - Si pending → mantener 'pending'
   - Si cancelled → cambiar a 'cancelled'
5. Trial comienza DESPUÉS de pago confirmado (si el plan tiene trial)
```

### Paso 4: Flujo con Trial

Para planes con período de prueba gratuito:
1. Crear suscripción con `status = 'pending'`
2. Al recibir `authorized` de MP:
   - Si `plan.trial_period_days > 0` → `status = 'trial'`
   - Si `plan.trial_period_days = 0` → `status = 'active'`
3. Al expirar trial sin pago → `status = 'expired'`

---

## 📋 Matriz de Transiciones de Estado

```
┌─────────┐   pago ok    ┌─────────┐   trial end   ┌─────────┐
│ pending │──────────────►│  trial  │───────────────►│ active  │
└────┬────┘              └────┬────┘               └────┬────┘
     │                        │                         │
     │ pago fail              │ no pago                 │ no pago
     ▼                        ▼                         ▼
┌─────────┐              ┌─────────┐               ┌─────────┐
│cancelled│              │ expired │               │past_due │
└─────────┘              └─────────┘               └────┬────┘
                                                        │
                                                   7 días
                                                        ▼
                                                  ┌───────────┐
                                                  │ cancelled │
                                                  └───────────┘
```

---

## 🔧 Archivos a Modificar

1. **Base de Datos:**
   - Ejecutar ALTER TYPE para agregar `pending` y `past_due`

2. **`app/api/webhooks/mercadopago/route.ts`:**
   - Corregir `mapMercadoPagoStatus()`

3. **`app/api/subscription/get-status/route.ts`:**
   - Corregir `mapMercadoPagoStatus()` duplicado

4. **`app/api/subscription/create/route.ts`:**
   - Cambiar estado inicial de `trial` a `pending`

5. **`lib/services/subscription-service.ts`:**
   - Cambiar estado inicial de `trial` a `pending`
   - Actualizar lógica de `handlePreapprovalWebhook()`

6. **`components/subscription/subscription-manager.tsx`:**
   - Verificar que UI maneje `pending` correctamente

---

## 🚨 Tiendas Afectadas Actualmente

Las tiendas que crearon suscripción con pago fallido tienen:
- `subscription_status = 'trial'` (INCORRECTO)
- Deberían tener `subscription_status = 'pending'`

Para corregir (después de agregar `pending` al enum):
```sql
UPDATE stores 
SET subscription_status = 'pending'
WHERE subscription_status = 'trial' 
  AND subscription_id IS NOT NULL
  AND (subscription_expires_at IS NULL OR subscription_expires_at < NOW());
```
