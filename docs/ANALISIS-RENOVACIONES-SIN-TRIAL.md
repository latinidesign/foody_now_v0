# 🔄 Análisis: Renovaciones Sin Trial

**Fecha:** 18 de diciembre de 2025  
**Escenario:** Estados `expired`, `cancelled`, `suspended` → Renovación SIN trial

---

## 🎯 Problema Identificado

### Situación actual:
- ✅ Tienda con estado `expired` puede intentar renovar
- ✅ Ya existe plan sin trial: `946bf6e3186741b5b7b8accbbdf646a5`
- ❌ **No hay lógica para decidir qué plan usar según historial**
- ❌ **Usuario podría abusar del trial renovando infinitamente**

### Estados que requieren renovación SIN trial:

| Estado | Descripción | ¿Ya usó trial? | Plan correcto |
|--------|-------------|----------------|---------------|
| `expired` | Trial/suscripción expiró | ✅ SÍ | **Sin trial** |
| `cancelled` | Usuario canceló voluntariamente | ✅ SÍ | **Sin trial** |
| `suspended` | Pausada por falta de pago | ✅ SÍ | **Sin trial** |
| `past_due` | Pago atrasado | ✅ SÍ | **Sin trial** |

### Estados que permiten trial:

| Estado | Descripción | ¿Ya usó trial? | Plan correcto |
|--------|-------------|----------------|---------------|
| `pending` | Primera vez, no completó | ❌ NO | **Con trial** |
| *Sin suscripción* | Nunca se suscribió | ❌ NO | **Con trial** |

---

## 📊 Análisis de la Implementación Actual

### 1. Componente UI (`subscription-status.tsx`)

**✅ LO QUE ESTÁ BIEN:**
\`\`\`tsx
{subscriptionData.status === 'suspended' && (
  <Link href={"https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=946bf6e3186741b5b7b8accbbdf646a5"}>
    <Button>Reactivar Suscripción</Button>
  </Link>
)}
\`\`\`
- Ya tiene el link al plan sin trial para `suspended`

**❌ LO QUE FALTA:**
\`\`\`tsx
// Estado EXPIRED no tiene botón de renovación
{subscriptionData.status === 'expired' && (
  // Solo muestra mensaje, NO botón de renovación ❌
)}

// Estado CANCELLED no tiene opción de renovación
// Estado PAST_DUE no tiene opción de renovación
\`\`\`

### 2. API de Creación (`/api/subscription/create/route.ts`)

**❌ PROBLEMA CRÍTICO:**
\`\`\`typescript
// Siempre usa el mismo plan que recibe en planId
const checkoutUrl = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${plan.mercadopago_plan_id}`

// NO verifica si la tienda ya usó trial ❌
// NO selecciona automáticamente plan sin trial ❌
\`\`\`

**✅ LO QUE DEBERÍA HACER:**
\`\`\`typescript
// 1. Verificar si la tienda tiene historial de suscripciones
const { data: previousSubscriptions } = await supabase
  .from('subscriptions')
  .select('status')
  .eq('store_id', storeId)
  .in('status', ['trial', 'active', 'expired', 'cancelled', 'suspended', 'past_due'])

// 2. Determinar si ya usó trial
const hasUsedTrial = previousSubscriptions && previousSubscriptions.length > 0

// 3. Elegir plan correcto
const planToUse = hasUsedTrial 
  ? '946bf6e3186741b5b7b8accbbdf646a5'  // Plan SIN trial
  : plan.mercadopago_plan_id              // Plan CON trial
\`\`\`

---

## 🔧 Solución Propuesta

### Fase 1: Base de Datos (⭐⭐⭐ CRÍTICO)

#### Opción A: Usar campo `trial_used` (Recomendado)

**Ventaja:** Control explícito por comercio
\`\`\`sql
-- Ya preparado en: scripts/add-trial-used-to-stores.sql
ALTER TABLE stores 
  ADD COLUMN trial_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN trial_used_at TIMESTAMP NULL;
\`\`\`

**Uso en código:**
\`\`\`typescript
const { data: store } = await supabase
  .from('stores')
  .select('trial_used')
  .eq('id', storeId)
  .single()

const shouldUseTrial = !store.trial_used
\`\`\`

#### Opción B: Consultar historial (Alternativa temporal)

**Ventaja:** No requiere migración inmediata
\`\`\`typescript
const { data: subscriptions } = await supabase
  .from('subscriptions')
  .select('id')
  .eq('store_id', storeId)
  .in('status', ['trial', 'active', 'expired', 'cancelled', 'suspended'])
  .limit(1)

const hasUsedTrial = subscriptions && subscriptions.length > 0
\`\`\`

### Fase 2: Configuración de Planes

**Crear constantes centralizadas:**

\`\`\`typescript
// lib/config/subscription-plans.ts

export const MERCADOPAGO_PLANS = {
  // Plan con trial de 7 días
  WITH_TRIAL: {
    id: 'TU_PLAN_ID_CON_TRIAL',  // ⚠️ Reemplazar con ID real
    name: 'Suscripción Mensual con Trial',
    trial_days: 7,
    price: 3000,
    currency: 'ARS'
  },
  
  // Plan sin trial (renovaciones)
  WITHOUT_TRIAL: {
    id: '946bf6e3186741b5b7b8accbbdf646a5',  // ✅ Ya existe
    name: 'Suscripción Mensual (Renovación)',
    trial_days: 0,
    price: 3000,
    currency: 'ARS'
  }
} as const

export type PlanType = 'WITH_TRIAL' | 'WITHOUT_TRIAL'

export function getMercadoPagoPlanId(planType: PlanType): string {
  return MERCADOPAGO_PLANS[planType].id
}

export function getPlanBySubscriptionHistory(hasUsedTrial: boolean): PlanType {
  return hasUsedTrial ? 'WITHOUT_TRIAL' : 'WITH_TRIAL'
}
\`\`\`

### Fase 3: Modificar API `/api/subscription/create`

\`\`\`typescript
// app/api/subscription/create/route.ts

import { MERCADOPAGO_PLANS, getPlanBySubscriptionHistory } from '@/lib/config/subscription-plans'

export async function POST(request: Request) {
  const { storeId, planId, payerEmail } = await request.json()
  
  // ... validaciones existentes ...

  // 🆕 PASO 1: Verificar si la tienda ya usó trial
  const { data: previousSubscriptions } = await supabase
    .from('subscriptions')
    .select('id, status')
    .eq('store_id', storeId)
    .in('status', ['trial', 'active', 'expired', 'cancelled', 'suspended', 'past_due'])
    .limit(1)

  const hasUsedTrial = previousSubscriptions && previousSubscriptions.length > 0

  // 🆕 PASO 2: Determinar plan correcto
  const planType = getPlanBySubscriptionHistory(hasUsedTrial)
  const mercadoPagoPlanId = MERCADOPAGO_PLANS[planType].id

  console.log(`🔍 Store ${storeId}: hasUsedTrial=${hasUsedTrial}, using plan=${planType}`)

  // 🆕 PASO 3: Crear suscripción local
  const trialDays = hasUsedTrial ? 0 : (MERCADOPAGO_PLANS[planType].trial_days || 7)
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .insert({
      store_id: storeId,
      plan_id: planId,
      status: 'pending',
      trial_started_at: trialDays > 0 ? new Date().toISOString() : null,
      trial_ends_at: trialDays > 0 ? trialEndsAt.toISOString() : null,
      auto_renewal: true
    })
    .select()
    .single()

  if (subscriptionError) {
    return NextResponse.json({ error: 'Error creando suscripción' }, { status: 500 })
  }

  // 🆕 PASO 4: Usar plan correcto en URL de MercadoPago
  const backUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription/success?subscription_id=${subscription.id}`
  const checkoutUrl = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${mercadoPagoPlanId}&back_url=${encodeURIComponent(backUrl)}`

  // 🆕 PASO 5: Marcar trial_used si es primera vez (opcional si usamos Opción A)
  if (!hasUsedTrial) {
    await supabase
      .from('stores')
      .update({
        trial_used: true,
        trial_used_at: new Date().toISOString()
      })
      .eq('id', storeId)
  }

  return NextResponse.json({
    success: true,
    subscription: subscription,
    init_point: checkoutUrl,
    trial_days: trialDays,
    plan_type: planType  // Para debugging
  })
}
\`\`\`

### Fase 4: Actualizar UI (`subscription-status.tsx`)

\`\`\`tsx
// components/admin/subscription-status.tsx

export function SubscriptionStatus() {
  // ... código existente ...

  return (
    <Card>
      <CardContent className="space-y-4">
        {/* ... contenido existente ... */}

        {/* 🆕 Botón para EXPIRED */}
        {subscriptionData.status === 'expired' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <h4 className="text-lg font-semibold text-red-800 mb-2">
              Suscripción Expirada
            </h4>
            <p className="text-sm text-red-700 mb-4">
              Tu período de prueba ha finalizado. Suscribite para seguir usando FoodyNow.
            </p>
            <Link href="/admin/subscription/plans">
              <Button className="w-full">
                Ver Planes de Suscripción
              </Button>
            </Link>
          </div>
        )}

        {/* 🆕 Botón para CANCELLED */}
        {subscriptionData.status === 'cancelled' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Suscripción Cancelada
            </h4>
            <p className="text-sm text-gray-700 mb-4">
              Cancelaste tu suscripción. Podés volver a suscribirte en cualquier momento.
            </p>
            <Link href="/admin/subscription/plans">
              <Button className="w-full" variant="outline">
                Renovar Suscripción
              </Button>
            </Link>
          </div>
        )}

        {/* ✅ Botón para SUSPENDED (ya existe, mantener) */}
        {subscriptionData.status === 'suspended' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">
              Volvé a activar tu cuenta
            </h4>
            <p className="text-sm text-yellow-700 mb-4">
              Podés volver a activar tu cuenta volviendo a suscribirte.
            </p>
            <Link href="/admin/subscription/plans">
              <Button className="w-full" variant="outline">
                Reactivar Suscripción
              </Button>
            </Link>
          </div>
        )}

        {/* 🆕 Botón para PAST_DUE */}
        {subscriptionData.status === 'past_due' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <h4 className="text-lg font-semibold text-orange-800 mb-2">
              Pago Pendiente
            </h4>
            <p className="text-sm text-orange-700 mb-4">
              Tu suscripción tiene un pago vencido. Actualizá tu medio de pago para continuar.
            </p>
            <Link href="/admin/subscription/plans">
              <Button className="w-full">
                Actualizar Medio de Pago
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
\`\`\`

**IMPORTANTE:** Los botones ahora van a `/admin/subscription/plans` en lugar de link directo a MP, para que la API decida automáticamente qué plan usar.

### Fase 5: Crear página de selección de planes

\`\`\`typescript
// app/admin/subscription/plans/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function SubscriptionPlansPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: 'CURRENT_STORE_ID',  // ⚠️ Obtener del contexto
          planId: 'monthly',
          payerEmail: 'USER_EMAIL'       // ⚠️ Obtener del usuario actual
        })
      })

      const data = await response.json()

      if (data.success && data.init_point) {
        // Redirigir a MercadoPago
        window.location.href = data.init_point
      } else {
        console.error('Error:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">Suscripción FoodyNow</h1>
      
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Plan Mensual</h2>
          <p className="text-4xl font-bold">$3.000 <span className="text-lg font-normal">/ mes</span></p>
          
          <ul className="space-y-2 text-sm">
            <li>✅ Gestión de pedidos ilimitados</li>
            <li>✅ WhatsApp Business integrado</li>
            <li>✅ Pagos con MercadoPago</li>
            <li>✅ Panel de administración completo</li>
            <li>✅ Soporte prioritario</li>
          </ul>

          <Button 
            onClick={handleSubscribe} 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Suscribirme Ahora'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            * El plan correcto (con o sin trial) se seleccionará automáticamente según tu historial
          </p>
        </div>
      </Card>
    </div>
  )
}
\`\`\`

---

## 📋 Casos de Uso Completos

### Caso 1: Usuario NUEVO (Primera vez)

**Escenario:**
- Nunca se suscribió antes
- `trial_used = false` (o no tiene registro)

**Flujo:**
1. Usuario hace clic en "Suscribirme"
2. API detecta: `hasUsedTrial = false`
3. API selecciona: Plan CON trial (7 días)
4. Redirige a MP con plan que tiene trial
5. Usuario autoriza suscripción
6. Webhook marca `trial_used = true`
7. Estado: `trial` → `active` (después de 7 días)

### Caso 2: Usuario con suscripción EXPIRADA

**Escenario:**
- Tuvo trial, expiró sin pagar
- `trial_used = true`
- Estado actual: `expired`

**Flujo:**
1. Usuario hace clic en "Ver Planes"
2. Usuario hace clic en "Suscribirme"
3. API detecta: `hasUsedTrial = true`
4. API selecciona: Plan SIN trial (`946bf6e3...`)
5. Redirige a MP con plan sin trial
6. Usuario paga inmediatamente
7. Webhook actualiza a `active`
8. ✅ **No hay trial, pago desde día 1**

### Caso 3: Usuario con suscripción CANCELADA

**Escenario:**
- Estuvo activo, luego canceló voluntariamente
- `trial_used = true`
- Estado actual: `cancelled`

**Flujo:**
1. Usuario hace clic en "Renovar Suscripción"
2. Usuario hace clic en "Suscribirme"
3. API detecta: `hasUsedTrial = true`
4. API selecciona: Plan SIN trial
5. Usuario paga inmediatamente
6. ✅ **No puede abusar del trial de nuevo**

### Caso 4: Usuario con suscripción SUSPENDIDA

**Escenario:**
- Tuvo pagos fallidos, MP suspendió
- `trial_used = true`
- Estado actual: `suspended`

**Flujo:**
1. Usuario hace clic en "Reactivar Suscripción"
2. Usuario hace clic en "Suscribirme"
3. API detecta: `hasUsedTrial = true`
4. API selecciona: Plan SIN trial
5. Usuario paga con nuevo medio de pago
6. ✅ **Reactivación sin trial**

---

## 🚨 Validaciones Críticas

### Validación 1: Prevenir múltiples trials

\`\`\`typescript
// En /api/subscription/create/route.ts

// Bloquear si intenta usar plan con trial habiendo ya usado trial
if (hasUsedTrial && requestedPlanId === PLAN_CON_TRIAL_ID) {
  return NextResponse.json({ 
    error: "Ya utilizaste tu período de prueba. Podés suscribirte sin trial.",
    suggested_plan: MERCADOPAGO_PLANS.WITHOUT_TRIAL.id
  }, { status: 400 })
}
\`\`\`

### Validación 2: Detectar fraude

\`\`\`typescript
// Verificar que no se haya creado otra tienda para obtener trial de nuevo
const { data: stores } = await supabase
  .from('stores')
  .select('id')
  .eq('owner_id', currentUserId)

if (stores.length > 1) {
  // Usuario tiene múltiples tiendas
  // Verificar si alguna ya usó trial
  const { data: anyTrialUsed } = await supabase
    .from('stores')
    .select('trial_used')
    .eq('owner_id', currentUserId)
    .eq('trial_used', true)
    .limit(1)

  if (anyTrialUsed && anyTrialUsed.length > 0) {
    // Al menos una tienda del usuario ya usó trial
    // Forzar plan sin trial para TODAS sus tiendas
    return MERCADOPAGO_PLANS.WITHOUT_TRIAL.id
  }
}
\`\`\`

---

## 🎯 Checklist de Implementación

### Prioridad CRÍTICA ⭐⭐⭐

- [ ] **Ejecutar migración SQL** (`add-trial-used-to-stores.sql`)
- [ ] **Crear archivo de constantes** (`lib/config/subscription-plans.ts`)
- [ ] **Modificar API de creación** (`/api/subscription/create/route.ts`)
  - [ ] Agregar lógica de detección de trial usado
  - [ ] Seleccionar plan correcto automáticamente
  - [ ] Marcar `trial_used = true` al autorizar
- [ ] **Modificar webhook** (`/api/webhooks/mercadopago/route.ts`)
  - [ ] Marcar `trial_used = true` en `authorized`
- [ ] **Actualizar UI** (`subscription-status.tsx`)
  - [ ] Agregar botón para `expired`
  - [ ] Agregar botón para `cancelled`
  - [ ] Actualizar botón de `suspended`
  - [ ] Agregar botón para `past_due`

### Prioridad ALTA ⭐⭐

- [ ] **Crear página de planes** (`/admin/subscription/plans/page.tsx`)
- [ ] **Agregar logging detallado** (qué plan se usó y por qué)
- [ ] **Agregar validación anti-fraude** (múltiples tiendas)

### Prioridad MEDIA ⭐

- [ ] **Agregar tests E2E** para flujos de renovación
- [ ] **Documentar en README** los dos planes disponibles
- [ ] **Crear dashboard admin** para ver stats de renovaciones

---

## 📊 Queries de Diagnóstico

\`\`\`sql
-- Ver tiendas con suscripciones expiradas que necesitan renovación
SELECT 
  s.id as store_id,
  s.name as store_name,
  s.slug,
  sub.status as subscription_status,
  sub.trial_ends_at,
  sub.created_at as first_subscription_date,
  CASE 
    WHEN s.trial_used THEN 'SIN TRIAL'
    ELSE 'CON TRIAL'
  END as plan_sugerido
FROM stores s
LEFT JOIN subscriptions sub ON sub.store_id = s.id
WHERE sub.status IN ('expired', 'cancelled', 'suspended', 'past_due')
ORDER BY sub.updated_at DESC;

-- Ver cuántos usuarios podrían renovar
SELECT 
  status,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM subscriptions
WHERE status IN ('expired', 'cancelled', 'suspended', 'past_due')
GROUP BY status;

-- Ver si hay usuarios con múltiples tiendas (posible fraude)
SELECT 
  owner_id,
  COUNT(*) as num_stores,
  ARRAY_AGG(name) as store_names
FROM stores
GROUP BY owner_id
HAVING COUNT(*) > 1;
\`\`\`

---

## 🎓 Decisiones de Diseño

### ¿Por qué usar `trial_used` en tabla `stores`?

**Ventajas:**
- ✅ Control por comercio (no por usuario)
- ✅ Evita consultas pesadas de historial
- ✅ Índice rápido para filtrar
- ✅ Claridad: saber de un vistazo si usó trial

**Desventajas:**
- ❌ Requiere migración de DB
- ❌ Datos duplicados (también en historial)

### ¿Por qué no usar link directo en botones?

**Antes (❌ PROBLEMA):**
\`\`\`tsx
<Link href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=946bf6e3...">
  <Button>Renovar</Button>
</Link>
\`\`\`

**Ahora (✅ SOLUCIÓN):**
\`\`\`tsx
<Link href="/admin/subscription/plans">
  <Button>Renovar</Button>
</Link>
\`\`\`

**Razón:**
- La API debe decidir qué plan usar
- No hardcodear plan_id en UI (difícil de mantener)
- Permite validaciones antes de redirigir
- Permite logging y analytics

---

## 🚀 Plan de Rollout

### Fase 1: Preparación (Día 1)
1. Ejecutar migración SQL
2. Crear archivo de constantes
3. Modificar API de creación
4. Testing manual

### Fase 2: Backend (Día 2)
1. Actualizar webhook
2. Agregar logging
3. Testing de flujos completos

### Fase 3: Frontend (Día 3)
1. Actualizar `subscription-status.tsx`
2. Crear página de planes
3. Testing E2E

### Fase 4: Monitoreo (Día 4+)
1. Desplegar a producción
2. Monitorear logs
3. Verificar que usuarios usen plan correcto

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Usuario en estado `expired` no puede renovar | Alto | Agregar botones para todos los estados |
| Usuario usa múltiples emails para trials | Alto | Validar por usuario, no solo por tienda |
| Plan ID incorrecto hardcodeado | Medio | Centralizar en archivo de constantes |
| Migración SQL falla | Alto | Hacer backup antes, usar `IF NOT EXISTS` |

---

## 📝 Resumen Ejecutivo

**Problema:** Usuarios con suscripciones `expired`, `cancelled`, o `suspended` necesitan renovar SIN trial, usando plan `946bf6e3186741b5b7b8accbbdf646a5`.

**Solución:** 
1. Agregar campo `trial_used` a tabla `stores`
2. API detecta automáticamente si ya usó trial
3. Selecciona plan correcto (con/sin trial)
4. UI muestra botones de renovación en todos los estados inactivos
5. Previene abuso de trial

**Impacto:**
- ✅ Usuarios expirados pueden renovar fácilmente
- ✅ No pueden abusar del trial
- ✅ Proceso transparente y automático
- ✅ Más conversiones (expired → active)

**Esfuerzo:** 1-2 días de desarrollo + testing

---

**Autor:** GitHub Copilot  
**Última actualización:** 18 de diciembre de 2025
