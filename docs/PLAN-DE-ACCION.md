# 🎯 Plan de Acción: Suscripciones FoodyNow

## 📋 Resumen Ejecutivo

**Fecha:** 18 de diciembre de 2025

### Estado actual: 6/10 ⚠️
- ✅ Sistema básico funcional
- ❌ **CRÍTICO:** Falta control de trial (abuso posible)
- ❌ Mapeo incompleto de estados MP

### Objetivo: 10/10 ✅
- Control completo de trial por comercio
- Mapeo correcto de 3 capas (suscripción, trial, pagos)
- Webhooks completos
- **🆕 Renovaciones sin trial** para estados expired/cancelled/suspended

---

## 🚨 Problemas Críticos Identificados

### ❌ 1. NO existe control de `trial_used`

**Riesgo:** Un comercio puede:
1. Crear suscripción → usar trial 30 días
2. Cancelar antes de pagar
3. Crear nueva suscripción → usar trial 30 días más
4. **Repetir infinitamente** ♾️

**Solución:** Campo `trial_used` en tabla `stores`

### ❌ 2. Usuarios expirados/cancelados pueden volver a usar trial

**Riesgo:** 
- Tienda con estado `expired` intenta renovar
- Sistema le ofrece trial de nuevo
- Abuso del período de prueba

**Solución:** 
- Detectar historial de suscripciones
- Usar plan sin trial: `946bf6e3186741b5b7b8accbbdf646a5`
- Ver análisis: `docs/ANALISIS-RENOVACIONES-SIN-TRIAL.md`

---

## ✅ Tareas Prioritarias

### 1️⃣ ALTA PRIORIDAD (Implementar HOY)

#### A. Agregar control de trial
\`\`\`bash
# En Supabase SQL Editor:
# Ejecutar: scripts/add-trial-used-to-stores.sql
\`\`\`

**Resultado:**
- ✅ Campo `trial_used` agregado a `stores`
- ✅ Tiendas existentes marcadas correctamente
- ✅ Índice para consultas rápidas

#### B. Actualizar creación de suscripción

**🔴 NUEVO REQUERIMIENTO:** Usuarios con `expired`, `cancelled`, `suspended` deben renovar SIN trial.  
**Plan sin trial:** `946bf6e3186741b5b7b8accbbdf646a5`

**Archivo:** `app/api/subscription/create/route.ts`

\`\`\`typescript
// AGREGAR ANTES DE CREAR SUSCRIPCIÓN:

// 1. Verificar si la tienda tiene historial de suscripciones
const { data: previousSubscriptions } = await supabase
  .from('subscriptions')
  .select('id')
  .eq('store_id', storeId)
  .in('status', ['trial', 'active', 'expired', 'cancelled', 'suspended', 'past_due'])
  .limit(1)

const hasUsedTrial = previousSubscriptions && previousSubscriptions.length > 0

// 2. Elegir plan según historial
const PLAN_WITH_TRIAL = 'TU_PLAN_CON_TRIAL_ID'      // ⚠️ Reemplazar
const PLAN_WITHOUT_TRIAL = '946bf6e3186741b5b7b8accbbdf646a5'  // ✅ Sin trial

const mercadoPagoPlanId = hasUsedTrial 
  ? PLAN_WITHOUT_TRIAL   // Renovación sin trial
  : PLAN_WITH_TRIAL      // Primera vez con trial

console.log(`🔍 Store ${storeId}: hasUsedTrial=${hasUsedTrial}, plan=${mercadoPagoPlanId}`)

// 3. Crear suscripción con el plan correcto y sin trial_days si es renovación
const trialDays = hasUsedTrial ? 0 : 7
\`\`\`

**Ver análisis completo:** `docs/ANALISIS-RENOVACIONES-SIN-TRIAL.md`

#### C. Marcar trial como usado en webhook

**Archivo:** `app/api/webhooks/mercadopago/route.ts`

\`\`\`typescript
// AGREGAR EN handleSubscriptionUpdate():

// Cuando la suscripción pasa a authorized, marcar trial_used
if (mpData.status === 'authorized') {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('store_id')
    .eq('mercadopago_preapproval_id', preapprovalId)
    .single()
  
  if (subscription) {
    await supabase
      .from('stores')
      .update({
        trial_used: true,
        trial_used_at: new Date().toISOString()
      })
      .eq('id', subscription.store_id)
      .eq('trial_used', false)  // Solo la primera vez
  }
}
\`\`\`

---

### 2️⃣ MEDIA PRIORIDAD (Esta semana)

#### D. Mejorar mapeo de estados

**Archivo:** `app/api/webhooks/mercadopago/route.ts`

\`\`\`typescript
// REEMPLAZAR mapMercadoPagoStatus():

async function mapMercadoPagoStatus(
  mpStatus: string, 
  preapproval: any
): Promise<string> {
  switch (mpStatus) {
    case 'authorized': {
      // Detectar trial por fechas (MP no tiene estado "trial")
      const now = new Date()
      const startDate = new Date(preapproval.auto_recurring.start_date)
      const isTrial = now < startDate
      
      return isTrial ? 'trial' : 'active'  // ✅ Correcto
    }
    case 'pending':
      return 'pending'
    case 'paused':
      return 'paused'      // Cambiar de 'suspended' a 'paused'
    case 'cancelled':
      return 'cancelled'
    case 'expired':
      return 'expired'
    default:
      return 'pending'
  }
}
\`\`\`

#### E. Agregar webhooks de pagos

**Archivo:** `app/api/webhooks/mercadopago/route.ts`

\`\`\`typescript
// AGREGAR EN POST():

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.type === 'subscription_preapproval') {
      await handleSubscriptionUpdate(body.data.id)
    } else if (body.action === 'payment.created') {  // ✅ NUEVO
      await handleInvoicePayment(body.data.id)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    // ...
  }
}

// AGREGAR NUEVA FUNCIÓN:
async function handleInvoicePayment(invoiceId: string) {
  // Obtener invoice de MP
  const invoice = await mp.getInvoice(invoiceId)
  
  // Actualizar suscripción según resultado del pago
  if (invoice.status === 'approved') {
    // Pago exitoso → cambiar de trial a active
    await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('mercadopago_preapproval_id', invoice.preapproval_id)
      
  } else if (['rejected', 'cancelled'].includes(invoice.status)) {
    // Pago fallido → cambiar a past_due
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('mercadopago_preapproval_id', invoice.preapproval_id)
  }
}
\`\`\`

---

### 3️⃣ BAJA PRIORIDAD (Próximamente)

#### F. Dashboard de monitoreo
- Crear `/app/admin/subscriptions/dashboard`
- Mostrar stats por estado
- Alertas de pagos fallidos

#### G. Notificaciones automáticas
- Email cuando trial está por vencer
- Email cuando pago falla
- Email cuando suscripción se cancela

---

## 📊 Cómo Verificar Estados Actuales

### Opción 1: Consulta SQL (Recomendado)

\`\`\`bash
# En Supabase SQL Editor:
# Ejecutar: scripts/diagnostico-estados-suscripciones.sql
\`\`\`

Esto mostrará:
- 📊 Resumen de estados
- 👥 Tiendas activas
- ⚠️ Problemas potenciales
- 📜 Tiendas con múltiples suscripciones (abuso)
- 💳 Análisis de pagos

### Opción 2: Endpoint API (Crear)

\`\`\`typescript
// app/api/admin/subscription-stats/route.ts
export async function GET() {
  const { data: stats } = await supabase.rpc('get_subscription_stats')
  
  return NextResponse.json({
    total: stats.total_stores,
    active: stats.active_subscriptions,
    trial: stats.trial_subscriptions,
    past_due: stats.past_due,
    cancelled: stats.cancelled
  })
}
\`\`\`

---

## 🎓 Casos de Uso Resueltos

### ✅ Usuario nuevo
1. Crea cuenta → `pending`
2. Autoriza en MP → `trial` (30 días)
3. **`trial_used = true`** se marca
4. Tiene acceso durante trial

### ✅ Usuario cancela en trial
1. En `trial` → cancela
2. Estado → `cancelled`
3. **`trial_used = true`** ya estaba marcado
4. Si vuelve → solo plan sin trial

### ✅ Trial termina y pago OK
1. En `trial` → expira trial
2. MP cobra → pago aprobado
3. Estado → `active`
4. Usuario sigue con acceso

### ✅ Trial termina y pago falla
1. En `trial` → expira trial
2. MP cobra → pago rechazado
3. Estado → `past_due`
4. Usuario pierde acceso (o gracia X días)

### ✅ Usuario cancela y vuelve
1. Cancelado, `trial_used = true`
2. Vuelve → ve plan sin trial
3. No puede abusar

---

## 📝 Checklist de Implementación

### HOY ✅
- [ ] Ejecutar `add-trial-used-to-stores.sql` en Supabase
- [ ] Actualizar tipo `Store` en `lib/types/subscription.ts`
- [ ] Modificar `/api/subscription/create` para elegir plan
- [ ] Modificar webhook para marcar `trial_used`
- [ ] Ejecutar `diagnostico-estados-suscripciones.sql`

### ESTA SEMANA 📅
- [ ] Mejorar `mapMercadoPagoStatus` con detección de trial
- [ ] Agregar handler de `invoice.payment_created`
- [ ] Agregar handler de `invoice.payment_failed`
- [ ] Crear endpoint `/api/admin/subscription-stats`

### PRÓXIMAMENTE 🔜
- [ ] Dashboard de suscripciones
- [ ] Notificaciones por email
- [ ] Logs de auditoría
- [ ] Tests automatizados

---

## 📂 Archivos del Proyecto

### Scripts SQL
- ✅ `scripts/add-trial-used-to-stores.sql` - Migración crítica
- ✅ `scripts/diagnostico-estados-suscripciones.sql` - Consultas de diagnóstico

### Documentación
- ✅ `docs/ANALISIS-IMPLEMENTACION-SUSCRIPCIONES.md` - Análisis completo
- ✅ `docs/PLAN-DE-ACCION.md` - Este documento

### Código a Modificar
- 🔧 `app/api/subscription/create/route.ts`
- 🔧 `app/api/webhooks/mercadopago/route.ts`
- 🔧 `lib/types/subscription.ts`

---

## 🆘 Soporte

Si necesitas ayuda:
1. Revisar `docs/ANALISIS-IMPLEMENTACION-SUSCRIPCIONES.md`
2. Ejecutar `diagnostico-estados-suscripciones.sql`
3. Verificar logs en Supabase
4. Consultar docs de MercadoPago

---

## 🎯 Próximo Paso INMEDIATO

\`\`\`bash
# 1. Ir a Supabase SQL Editor
# 2. Copiar contenido de: scripts/add-trial-used-to-stores.sql
# 3. Ejecutar
# 4. Verificar resultado
\`\`\`

**Tiempo estimado:** 5 minutos  
**Impacto:** CRÍTICO ⭐⭐⭐

---

**Última actualización:** 18 de diciembre de 2025
