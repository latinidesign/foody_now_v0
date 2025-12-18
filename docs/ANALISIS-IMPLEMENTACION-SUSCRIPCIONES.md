# 🔍 Análisis de Implementación de Suscripciones FoodyNow

**Fecha:** 18 de diciembre de 2025  
**Comparación:** Implementación actual vs. Modelo recomendado MercadoPago

---

## 📊 Resumen Ejecutivo

### ✅ Lo que está BIEN implementado:
1. ✅ Estados básicos mapeados correctamente
2. ✅ Webhook configurado para recibir notificaciones de MP
3. ✅ Sistema de planes con trial configurado
4. ✅ Estado `pending` se asigna correctamente al crear suscripción

### ⚠️ Lo que FALTA implementar:
1. ❌ **Campo `trial_used` en tabla `stores`** (crítico)
2. ❌ Detección de trial basada en fechas (no en estado)
3. ❌ Lógica para elegir plan con/sin trial según historial
4. ❌ Mapeo completo de estados de pagos (invoices)
5. ❌ Estados `paused` y manejo de `authorized` con trial

---

## 🎯 1. Estados de Suscripción (Capa 1)

### Implementación Actual

**TypeScript (`lib/types/subscription.ts`):**
```typescript
export type SubscriptionStatus = 
  'trial' | 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended' | 'past_due'
```

**Mapeo en Webhook (`app/api/webhooks/mercadopago/route.ts`):**
```typescript
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'authorized': return 'active'     // ⚠️ PROBLEMA: No considera trial
    case 'pending':    return 'pending'
    case 'paused':     return 'suspended'
    case 'cancelled':  return 'cancelled'
    default:           return 'pending'
  }
}
```

### 🔴 Problema Identificado #1: Estado "trial" vs "authorized"

**Estado actual:** 
- FoodyNow tiene un estado llamado `'trial'`
- MercadoPago NO tiene ese estado
- MP usa `'authorized'` para suscripciones activas (con o sin trial)

**Mapeo incorrecto:**
```typescript
case 'authorized': return 'active'  // ❌ Pierde información del trial
```

**Mapeo correcto recomendado:**
```typescript
case 'authorized': {
  // Detectar si está en trial comparando fechas
  const now = new Date()
  const startDate = new Date(preapproval.auto_recurring.start_date)
  const isTrial = now < startDate
  
  return isTrial ? 'trial' : 'active'  // ✅
}
```

### 📋 Comparación de Estados

| Estado MP | Estado FoodyNow Actual | Estado FoodyNow Recomendado | Notas |
|-----------|------------------------|----------------------------|-------|
| `pending` | `pending` ✅ | `pending` | Usuario no completó checkout |
| `authorized` (en trial) | `active` ❌ | `trial` | Usuario en período de prueba |
| `authorized` (pagando) | `active` ✅ | `active` | Usuario con pagos aprobados |
| `paused` | `suspended` ✅ | `paused` | Suscripción pausada |
| `cancelled` | `cancelled` ✅ | `cancelled` | Suscripción cancelada |
| `expired` | ❌ (no mapeado) | `expired` | Suscripción vencida |

---

## 🧪 2. Estados del Trial (Capa 2)

### ⚠️ Problema Crítico: Falta control de "trial_used"

**Estado actual en DB:**
```sql
-- Tabla stores NO tiene estos campos:
trial_used BOOLEAN DEFAULT FALSE       -- ❌ FALTA
trial_used_at TIMESTAMP NULL           -- ❌ FALTA
```

**Scripts revisados:**
- ✅ `scripts/subscription-system.sql` - Define estructura base
- ✅ `scripts/fix-subscription-enum.sql` - Agrega estados faltantes
- ❌ **Ningún script agrega `trial_used` a tabla `stores`**

### 🎯 Solución Recomendada

#### A. Crear migración SQL:

```sql
-- scripts/add-trial-used-to-stores.sql

-- Agregar campos para control de trial por comercio
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMP NULL;

-- Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_stores_trial_used 
  ON stores(trial_used) 
  WHERE trial_used = false;

-- Marcar como trial_used las tiendas que ya tienen suscripciones
UPDATE stores 
SET 
  trial_used = true,
  trial_used_at = (
    SELECT MIN(created_at) 
    FROM subscriptions 
    WHERE subscriptions.store_id = stores.id
  )
WHERE id IN (
  SELECT DISTINCT store_id 
  FROM subscriptions 
  WHERE status IN ('trial', 'active', 'cancelled', 'expired')
);

COMMENT ON COLUMN stores.trial_used IS 
  'Indica si el comercio ya utilizó su período de prueba gratuito (una sola vez)';

COMMENT ON COLUMN stores.trial_used_at IS 
  'Fecha en que se marcó trial_used = true (primera autorización de suscripción)';
```

#### B. Actualizar TypeScript:

**Tipo Store (`lib/types/subscription.ts`):**
```typescript
export interface Store {
  id: string
  name: string
  slug: string
  trial_used: boolean         // ✅ AGREGAR
  trial_used_at?: string      // ✅ AGREGAR
}
```

---

## 💳 3. Estados de Pagos (Capa 3)

### Estado Actual

**No implementado explícitamente.**

Actualmente, FoodyNow:
- ✅ Guarda `subscription_payments` con estados
- ❌ NO consulta pagos para determinar `past_due`
- ❌ NO escucha webhooks de `invoice.payment_created` / `invoice.payment_failed`

### 📋 Estados de Pagos MP

| Estado MP | Significado | Acción FoodyNow |
|-----------|-------------|-----------------|
| `approved` | Pago exitoso | Mantener acceso |
| `pending` | Esperando confirmación | Dar gracia 24-48h |
| `in_process` | En validación | Dar gracia 24-48h |
| `rejected` | Pago fallido | Cambiar a `past_due` |
| `cancelled` | Pago cancelado | Cambiar a `past_due` |
| `refunded` | Devuelto | Evaluar caso |
| `charged_back` | Contracargo | Suspender acceso |

### 🎯 Lógica Recomendada

```typescript
// En webhook handler
async function handleInvoicePayment(invoiceId: string) {
  const invoice = await mp.getInvoice(invoiceId)
  
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('mercadopago_preapproval_id', invoice.preapproval_id)
    .single()
  
  if (invoice.status === 'approved') {
    // Pago exitoso
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        last_payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)
      
  } else if (['rejected', 'cancelled'].includes(invoice.status)) {
    // Pago fallido
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',  // ✅ Estado correcto para pago fallido
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)
  }
}
```

---

## 🔧 4. Plan de Acción Recomendado

### Prioridad ALTA (Críticas)

#### 1. Agregar control de `trial_used` ⭐⭐⭐
```bash
# Ejecutar en Supabase SQL Editor
psql < scripts/add-trial-used-to-stores.sql
```

#### 2. Actualizar lógica de creación de suscripción ⭐⭐⭐

**Archivo:** `app/api/subscription/create/route.ts`

```typescript
// ANTES DE CREAR SUSCRIPCIÓN
const { data: store } = await supabase
  .from('stores')
  .select('trial_used')
  .eq('id', storeId)
  .single()

// Elegir plan según historial
const planToUse = store.trial_used 
  ? 'PLAN_RENOVACION_SIN_TRIAL'  // Plan sin trial
  : planId                         // Plan con trial

// Luego crear suscripción con planToUse
```

#### 3. Marcar `trial_used` en webhook ⭐⭐⭐

**Archivo:** `app/api/webhooks/mercadopago/route.ts`

```typescript
async function handleSubscriptionUpdate(preapprovalId: string) {
  // ... código existente ...
  
  // Si la suscripción pasa a authorized, marcar trial como usado
  if (mpData.status === 'authorized') {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('store_id')
      .eq('mercadopago_preapproval_id', preapprovalId)
      .single()
    
    if (subscription) {
      // Marcar trial_used = true en la tienda
      await supabase
        .from('stores')
        .update({
          trial_used: true,
          trial_used_at: new Date().toISOString()
        })
        .eq('id', subscription.store_id)
        .eq('trial_used', false)  // Solo si no estaba marcado antes
    }
  }
}
```

### Prioridad MEDIA

#### 4. Mejorar mapeo de estados ⭐⭐

**Archivo:** `app/api/webhooks/mercadopago/route.ts`

```typescript
async function mapMercadoPagoStatus(
  mpStatus: string, 
  preapproval: any
): Promise<string> {
  switch (mpStatus) {
    case 'authorized': {
      // Detectar trial por fechas
      const now = new Date()
      const startDate = new Date(preapproval.auto_recurring.start_date)
      return now < startDate ? 'trial' : 'active'
    }
    case 'pending':
      return 'pending'
    case 'paused':
      return 'paused'  // Cambiar de 'suspended' a 'paused'
    case 'cancelled':
      return 'cancelled'
    case 'expired':
      return 'expired'
    default:
      return 'pending'
  }
}
```

#### 5. Agregar webhooks de pagos ⭐⭐

**Archivo:** `app/api/webhooks/mercadopago/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Manejar diferentes tipos de notificaciones
    if (body.type === 'subscription_preapproval') {
      await handleSubscriptionUpdate(body.data.id)
    } else if (body.type === 'subscription_preapproval_plan') {
      await handlePlanUpdate(body.data.id)
    } else if (body.action === 'payment.created') {  // ✅ NUEVO
      await handleInvoicePayment(body.data.id)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    // ...
  }
}
```

### Prioridad BAJA

#### 6. Agregar dashboard de monitoreo ⭐

Crear endpoint para consultar estados:

```typescript
// app/api/admin/subscription-stats/route.ts
export async function GET() {
  const stats = await supabase.rpc('get_subscription_stats')
  
  return NextResponse.json({
    total_stores: stats.total,
    active_subscriptions: stats.active,
    trial_subscriptions: stats.trial,
    past_due: stats.past_due,
    cancelled: stats.cancelled,
    trial_used_stores: stats.trial_used
  })
}
```

---

## 📈 5. Detección de Estados Actuales (Query Manual)

Para identificar estados actuales de usuarios, ejecutar en Supabase:

```sql
-- Estados actuales de suscripciones
SELECT 
  s.status,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM subscriptions s
GROUP BY s.status
ORDER BY cantidad DESC;

-- Tiendas con detalle de suscripción
SELECT 
  st.id,
  st.name,
  st.slug,
  s.status as subscription_status,
  s.trial_started_at,
  s.trial_ends_at,
  s.mercadopago_preapproval_id,
  CASE 
    WHEN s.status = 'trial' AND s.trial_ends_at > NOW() 
      THEN EXTRACT(DAY FROM s.trial_ends_at - NOW())::INTEGER
    ELSE 0
  END as dias_trial_restantes,
  s.created_at as subscription_created_at
FROM stores st
LEFT JOIN subscriptions s ON s.store_id = st.id
WHERE s.id IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 20;

-- Verificar si ya hay campo trial_used (probablemente no)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stores' 
  AND column_name IN ('trial_used', 'trial_used_at');
```

---

## 🎓 6. Casos de Uso y Comportamiento Esperado

### Caso 1: Usuario nuevo se suscribe por primera vez

**Estado actual:**
1. ❌ Usuario crea cuenta → estado `pending`
2. ❌ Redirige a MP → paga → webhook cambia a `active` (debería ser `trial`)
3. ❌ `trial_used` NO se marca (no existe el campo)

**Estado recomendado:**
1. ✅ Usuario crea cuenta → estado `pending`
2. ✅ Redirige a MP → paga → webhook cambia a `trial` (detecta por fechas)
3. ✅ `trial_used = true` se marca en la tienda
4. ✅ Usuario tiene acceso durante período de prueba

### Caso 2: Usuario cancela durante el trial

**Estado actual:**
1. ❌ Usuario en `active` (debería ser `trial`)
2. ✅ Cancela → estado cambia a `cancelled`
3. ❌ `trial_used` NO se marca (no existe)

**Estado recomendado:**
1. ✅ Usuario en `trial`
2. ✅ Cancela → estado cambia a `cancelled`
3. ✅ `trial_used = true` YA está marcado (desde autorización)
4. ✅ Si vuelve, solo ve planes sin trial

### Caso 3: Trial termina y pago es exitoso

**Estado actual:**
1. ❌ Usuario en `active` (no detecta fin de trial)
2. ❌ No hay verificación de pagos por invoices

**Estado recomendado:**
1. ✅ Usuario en `trial` → fecha de trial expira
2. ✅ MP intenta cobro → webhook `invoice.payment_created`
3. ✅ Pago aprobado → estado cambia de `trial` a `active`
4. ✅ Usuario sigue con acceso

### Caso 4: Trial termina y pago falla

**Estado actual:**
1. ❌ Usuario en `active` (no detecta problema)
2. ❌ No hay cambio automático a `past_due`

**Estado recomendado:**
1. ✅ Usuario en `trial` → fecha de trial expira
2. ✅ MP intenta cobro → falla → webhook `invoice.payment_failed`
3. ✅ Estado cambia de `trial` a `past_due`
4. ✅ Usuario pierde acceso (o gracia de X días)

### Caso 5: Usuario cancela y vuelve meses después

**Estado actual:**
1. ❌ Usuario cancelado
2. ❌ Vuelve → ve plan con trial de nuevo (porque no hay `trial_used`)
3. ❌ Puede abusar del trial infinitamente

**Estado recomendado:**
1. ✅ Usuario cancelado, `trial_used = true`
2. ✅ Vuelve → solo ve plan de renovación SIN trial
3. ✅ No puede abusar del trial

---

## 🎯 7. Checklist de Implementación

### Para implementar HOY ✅

- [ ] Crear script `add-trial-used-to-stores.sql`
- [ ] Ejecutar migración en Supabase
- [ ] Actualizar tipo `Store` en TypeScript
- [ ] Modificar `/api/subscription/create` para elegir plan según `trial_used`
- [ ] Modificar webhook para marcar `trial_used = true` en `authorized`

### Para implementar esta semana 📅

- [ ] Mejorar `mapMercadoPagoStatus` para detectar trial por fechas
- [ ] Agregar webhook handler para `invoice.payment_created`
- [ ] Agregar webhook handler para `invoice.payment_failed`
- [ ] Crear endpoint de stats `/api/admin/subscription-stats`

### Para implementar próximamente 🔜

- [ ] Dashboard de monitoreo de suscripciones
- [ ] Lógica de gracia para `past_due` (X días antes de suspender)
- [ ] Notificaciones automáticas por email en cambios de estado
- [ ] Logs de auditoría de cambios de suscripción

---

## 📝 8. Resumen de Archivos a Modificar

| Archivo | Acción | Prioridad |
|---------|--------|-----------|
| `scripts/add-trial-used-to-stores.sql` | Crear nuevo | ⭐⭐⭐ |
| `lib/types/subscription.ts` | Actualizar `Store` | ⭐⭐⭐ |
| `app/api/subscription/create/route.ts` | Agregar lógica `trial_used` | ⭐⭐⭐ |
| `app/api/webhooks/mercadopago/route.ts` | Marcar `trial_used`, mejorar mapeo | ⭐⭐⭐ |
| `lib/services/subscription-service.ts` | Agregar método `hasUsedTrial()` | ⭐⭐ |
| `components/admin/subscription-status.tsx` | Mostrar info de trial usado | ⭐ |

---

## 🚨 Conclusión

**Estado actual:** 6/10
- ✅ Base funcional implementada
- ⚠️ Falta control crítico de trial (abuso posible)
- ⚠️ Mapeo de estados incompleto

**Estado objetivo:** 10/10
- ✅ Control completo de trial por comercio
- ✅ Mapeo correcto de 3 capas (suscripción, trial, pagos)
- ✅ Webhooks completos
- ✅ Monitoreo y auditoría

**Próximo paso crítico:**
1. Agregar campo `trial_used` a tabla `stores`
2. Marcar `trial_used = true` en primer `authorized`
3. Elegir plan correcto según historial

---

**Autor:** GitHub Copilot  
**Última actualización:** 18 de diciembre de 2025
