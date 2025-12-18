# 📊 Resumen Visual: Sistema de Suscripciones FoodyNow
## Incluyendo Renovaciones Sin Trial

**Fecha:** 18 de diciembre de 2025

---

## 🎯 Modelo de 3 Capas + Control de Trial

```
┌─────────────────────────────────────────────────────────────┐
│                   CAPA 0: CONTROL DE TRIAL                  │
│  (NUEVO: Prevenir abuso + Renovaciones sin trial)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Campo en tabla `stores`:                                   │
│  • trial_used: BOOLEAN                                      │
│  • trial_used_at: TIMESTAMP                                 │
│                                                             │
│  Lógica:                                                    │
│  ✅ Primera suscripción → Plan CON trial (7 días)          │
│  ❌ Renovación → Plan SIN trial (pago inmediato)           │
│                                                             │
│  Estados que marcan trial como usado:                       │
│  • trial, active, expired, cancelled, suspended, past_due   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│              CAPA 1: ESTADOS DE PREAPPROVAL                 │
│           (Estados de suscripción MercadoPago)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MercadoPago          →  FoodyNow                           │
│  ────────────────────────────────────                       │
│  pending              →  pending                            │
│  authorized (trial)   →  trial       🆕 Detectar por fechas │
│  authorized (pagando) →  active                             │
│  paused               →  paused                             │
│  cancelled            →  cancelled                          │
│  expired              →  expired     🆕 Mapeado             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│               CAPA 2: LÓGICA DE TRIAL                       │
│              (Basada en fechas y trial_used)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Detección de trial:                                        │
│  • NOW() < auto_recurring.start_date → trial                │
│  • NOW() >= auto_recurring.start_date → active              │
│                                                             │
│  Control de trial_used:                                     │
│  • Primera autorización → trial_used = true                 │
│  • Renovación → trial_used ya en true, plan sin trial       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────────┐
│              CAPA 3: ESTADOS DE PAGOS                       │
│                 (Invoices de MercadoPago)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Estado Invoice       →  Acción FoodyNow                    │
│  ────────────────────────────────────────                   │
│  approved             →  Mantener active                    │
│  pending / in_process →  Dar gracia 24-48h                  │
│  rejected / cancelled →  Cambiar a past_due                 │
│  charged_back         →  Suspender acceso                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Vida de una Suscripción

### Escenario 1: Usuario NUEVO (Primera vez)

```
┌─────────────────────┐
│  Usuario se crea    │
│  trial_used = false │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Click "Suscribirme" │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ API detecta:             │
│ hasUsedTrial = false     │
│                          │
│ 🎯 Plan: CON TRIAL       │
│ ID: [PLAN_WITH_TRIAL]    │
│ Trial: 7 días            │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Usuario autoriza en MP   │
│ Estado: pending → trial  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Webhook recibe:          │
│ status = "authorized"    │
│                          │
│ ✅ Marca:                │
│ trial_used = true        │
│ trial_used_at = NOW()    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Usuario en trial 7 días  │
│ Estado: trial            │
└──────────┬───────────────┘
           │
           ▼ (después de 7 días)
           │
┌──────────────────────────┐
│ MP cobra primer pago     │
└──────────┬───────────────┘
           │
      ┌────┴────┐
      │         │
      ▼         ▼
 ✅ Pago OK  ❌ Pago fallido
      │         │
      ▼         ▼
   active    past_due
```

---

### Escenario 2: Usuario con Suscripción EXPIRADA (Renovación)

```
┌─────────────────────┐
│  Usuario existente  │
│  Estado: expired    │
│  trial_used = true  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ Click "Ver Planes"       │
│ (en subscription-status) │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Click "Suscribirme"      │
│ (en página de planes)    │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ API consulta historial:  │
│                          │
│ SELECT * FROM            │
│ subscriptions            │
│ WHERE store_id = ?       │
│ AND status IN (...)      │
│                          │
│ hasUsedTrial = true ✅   │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ 🎯 Plan: SIN TRIAL       │
│ ID: 946bf6e3...          │
│ Trial: 0 días            │
│                          │
│ ⚠️ PAGO INMEDIATO        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Usuario paga en MP       │
│ (sin período de prueba)  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Webhook recibe:          │
│ status = "authorized"    │
│                          │
│ ✅ Cambia estado:        │
│ expired → active         │
│                          │
│ (trial_used ya en true)  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Usuario ACTIVO           │
│ Sin trial, pagó inmediato│
└──────────────────────────┘
```

---

### Escenario 3: Usuario CANCELADO que vuelve (Renovación)

```
┌─────────────────────┐
│  Usuario existente  │
│  Estado: cancelled  │
│  trial_used = true  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ Click "Renovar"          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ API detecta:             │
│ hasUsedTrial = true      │
│                          │
│ 🎯 Plan: SIN TRIAL       │
│ ID: 946bf6e3...          │
│                          │
│ ❌ NO puede usar trial   │
│    de nuevo              │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Paga inmediatamente      │
│ Estado: cancelled →      │
│         active           │
└──────────────────────────┘
```

---

### Escenario 4: Usuario SUSPENDIDO (Reactivación)

```
┌─────────────────────┐
│  Usuario existente  │
│  Estado: suspended  │
│  trial_used = true  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│ Click "Reactivar"        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ API detecta:             │
│ hasUsedTrial = true      │
│                          │
│ 🎯 Plan: SIN TRIAL       │
│ Requiere nuevo medio     │
│ de pago                  │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Usuario actualiza tarjeta│
│ y paga                   │
│                          │
│ Estado: suspended →      │
│         active           │
└──────────────────────────┘
```

---

## 🎨 Estados Visuales en UI

```
┌──────────────────────────────────────────────────────────┐
│  Estado          │  Badge     │  Mensaje al Usuario      │
├──────────────────────────────────────────────────────────┤
│  pending         │  🟡 Amarillo │ "Pago pendiente"        │
│  trial           │  🔵 Azul    │ "Trial Gratuito"        │
│  active          │  🟢 Verde   │ "Suscripción Activa"    │
│  past_due        │  🟠 Naranja │ "Pago Vencido"          │
│  suspended       │  🟡 Amarillo │ "Suspendida"            │
│  cancelled       │  🔴 Rojo    │ "Cancelada"             │
│  expired         │  ⚪ Gris    │ "Expirada"              │
└──────────────────────────────────────────────────────────┘
```

### Botones de Acción según Estado

```
┌─────────────────────────────────────────────────────────────┐
│  Estado      │  Botón Visible        │  Destino             │
├─────────────────────────────────────────────────────────────┤
│  trial       │  (ninguno)            │  -                   │
│  active      │  "Gestionar"          │  /admin/subscription │
│  pending     │  "Completar Pago"     │  /admin/plans        │
│  expired     │  "Ver Planes"         │  /admin/plans        │ 🆕
│  cancelled   │  "Renovar Suscripción"│  /admin/plans        │ 🆕
│  suspended   │  "Reactivar"          │  /admin/plans        │ 🆕
│  past_due    │  "Actualizar Pago"    │  /admin/plans        │ 🆕
└─────────────────────────────────────────────────────────────┘
```

**⚠️ IMPORTANTE:** Todos los botones de renovación/reactivación ahora van a `/admin/plans` en lugar de link directo a MP. La API decide automáticamente qué plan usar.

---

## 🧬 Arquitectura de Archivos

```
foody_now_v0/
│
├── lib/
│   ├── config/
│   │   └── subscription-plans.ts          🆕 Config centralizada
│   │       • MERCADOPAGO_PLANS
│   │       • getPlanTypeByHistory()
│   │       • generateCheckoutUrl()
│   │
│   ├── types/
│   │   └── subscription.ts
│   │       • Store interface              🔄 Agregar trial_used
│   │       • SubscriptionStatus type
│   │
│   └── services/
│       └── subscription-service.ts        🔄 Agregar hasUsedTrial()
│
├── app/
│   ├── api/
│   │   ├── subscription/
│   │   │   └── create/
│   │   │       └── route.ts               🔄 Lógica de selección de plan
│   │   │
│   │   └── webhooks/
│   │       └── mercadopago/
│   │           └── route.ts               🔄 Marcar trial_used
│   │
│   └── admin/
│       └── subscription/
│           └── plans/
│               └── page.tsx               🆕 Página de suscripción
│
├── components/
│   └── admin/
│       └── subscription-status.tsx         🔄 Agregar botones para todos
│
├── scripts/
│   ├── add-trial-used-to-stores.sql       ✅ Ya creado
│   └── diagnostico-estados-suscripciones.sql
│
└── docs/
    ├── ANALISIS-IMPLEMENTACION-SUSCRIPCIONES.md  ✅
    ├── ANALISIS-RENOVACIONES-SIN-TRIAL.md        🆕
    ├── PLAN-DE-ACCION.md                         ✅
    └── RESUMEN-VISUAL-V2.md                      🆕 Este archivo
```

---

## 🔐 Variables de Entorno Necesarias

```bash
# .env.local

# Plan con trial de 7 días (para usuarios nuevos)
NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID="[TU_PLAN_ID_AQUI]"

# Plan sin trial (para renovaciones) - Ya creado
# Este NO necesita variable, está hardcodeado:
# 946bf6e3186741b5b7b8accbbdf646a5

# MercadoPago Access Token
MERCADOPAGO_ACCESS_TOKEN="[TU_ACCESS_TOKEN]"

# App URL
NEXT_PUBLIC_APP_URL="https://tudominio.com"
```

---

## 📊 Tabla de Decisión: ¿Qué Plan Usar?

| Condición | Estado Actual | Tiene Historial | Plan a Usar | Trial Días |
|-----------|---------------|-----------------|-------------|------------|
| Primera vez | null / pending | ❌ NO | WITH_TRIAL | 7 |
| Reactivar | expired | ✅ SÍ | WITHOUT_TRIAL | 0 |
| Renovar | cancelled | ✅ SÍ | WITHOUT_TRIAL | 0 |
| Reactivar | suspended | ✅ SÍ | WITHOUT_TRIAL | 0 |
| Actualizar | past_due | ✅ SÍ | WITHOUT_TRIAL | 0 |
| Volver | trial → cancelled | ✅ SÍ | WITHOUT_TRIAL | 0 |
| Volver | active → cancelled | ✅ SÍ | WITHOUT_TRIAL | 0 |

**Regla simple:**
```typescript
const hasUsedTrial = await checkSubscriptionHistory(storeId)
// hasUsedTrial = true si existe CUALQUIER suscripción en estados:
// trial, active, expired, cancelled, suspended, past_due

const plan = hasUsedTrial ? 'WITHOUT_TRIAL' : 'WITH_TRIAL'
```

---

## 🧪 Testing Manual

### Test 1: Usuario nuevo (debe ver trial)
```bash
1. Crear nuevo usuario/tienda
2. Ir a /admin/subscription
3. Click "Suscribirme"
4. Verificar en MP: debe mostrar "7 días de prueba gratuita"
5. Autorizar suscripción
6. Verificar DB: trial_used = true
```

### Test 2: Usuario expirado (NO debe ver trial)
```bash
1. Tener usuario con estado "expired"
2. Verificar DB: trial_used = true
3. Click "Ver Planes"
4. Click "Suscribirme"
5. Verificar en MP: NO debe mostrar trial, pago inmediato
6. Pagar
7. Verificar: estado cambia a "active"
```

### Test 3: Usuario cancelado que vuelve (NO debe ver trial)
```bash
1. Usuario con estado "cancelled"
2. Click "Renovar Suscripción"
3. Verificar en MP: plan sin trial
4. Pagar
5. Estado: cancelled → active
```

---

## 🚀 Orden de Implementación

### Día 1: Backend
1. ✅ Ejecutar `add-trial-used-to-stores.sql`
2. 🔄 Crear `lib/config/subscription-plans.ts`
3. 🔄 Modificar `app/api/subscription/create/route.ts`
4. 🔄 Modificar `app/api/webhooks/mercadopago/route.ts`

### Día 2: Frontend
1. 🔄 Actualizar `components/admin/subscription-status.tsx`
2. 🔄 Crear `app/admin/subscription/plans/page.tsx`
3. 🧪 Testing manual de flujos

### Día 3: Testing y Docs
1. 🧪 Test E2E de todos los flujos
2. 📝 Actualizar README.md
3. 🚀 Deploy a producción

---

## ⚠️ Puntos Críticos de Validación

### ✅ Checkpoint 1: Después de migración SQL
```sql
-- Verificar que trial_used existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stores' 
  AND column_name = 'trial_used';

-- Verificar tiendas marcadas
SELECT id, name, trial_used, trial_used_at 
FROM stores 
WHERE trial_used = true;
```

### ✅ Checkpoint 2: Después de modificar API
```bash
# Verificar logs al crear suscripción
# Debe mostrar:
🔍 Store abc123: hasUsedTrial=false, plan=WITH_TRIAL
🔍 Store xyz789: hasUsedTrial=true, plan=WITHOUT_TRIAL
```

### ✅ Checkpoint 3: En producción
```sql
-- Monitorear renovaciones
SELECT 
  s.store_id,
  st.trial_used,
  s.status,
  s.trial_ends_at,
  s.created_at
FROM subscriptions s
JOIN stores st ON st.id = s.store_id
WHERE s.created_at > NOW() - INTERVAL '1 day'
ORDER BY s.created_at DESC;
```

---

**Autor:** GitHub Copilot  
**Última actualización:** 18 de diciembre de 2025  
**Versión:** 2.0 (Con renovaciones sin trial)
