# 🎯 Resumen Visual: Estados de Suscripciones FoodyNow

```
┌─────────────────────────────────────────────────────────────────┐
│                   ESTADO ACTUAL: 6/10 ⚠️                        │
│                                                                 │
│  ✅ Sistema básico funcional                                    │
│  ❌ NO existe control de trial_used (CRÍTICO)                  │
│  ⚠️  Mapeo incompleto de estados MP                            │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Mapeo de Estados

### Capa 1: Estados de Suscripción (Preapproval)

```
┌────────────────┬──────────────────┬─────────────────┬──────────┐
│ Estado MP      │ Estado Actual    │ Estado Correcto │ Estado   │
├────────────────┼──────────────────┼─────────────────┼──────────┤
│ pending        │ pending ✅       │ pending         │ ✅ OK    │
│ authorized     │ active ❌        │ trial/active    │ ❌ ERROR │
│ paused         │ suspended ⚠️     │ paused          │ ⚠️ MEJORAR│
│ cancelled      │ cancelled ✅     │ cancelled       │ ✅ OK    │
│ expired        │ (no mapeado) ❌  │ expired         │ ❌ FALTA │
└────────────────┴──────────────────┴─────────────────┴──────────┘
```

### Capa 2: Control de Trial

```
┌─────────────────────────────────────────────────────────────────┐
│                    ❌ PROBLEMA CRÍTICO                          │
│                                                                 │
│  Campo trial_used NO EXISTE en tabla stores                    │
│                                                                 │
│  Riesgo: Abuso ilimitado del trial                            │
│  ═══════════════════════════════════════                       │
│                                                                 │
│  Usuario puede:                                                │
│  1. Crear suscripción → trial 30 días                         │
│  2. Cancelar antes de pagar                                    │
│  3. Crear nueva suscripción → trial 30 días más               │
│  4. REPETIR INFINITAMENTE ♾️                                   │
│                                                                 │
│  Solución: Ejecutar add-trial-used-to-stores.sql              │
└─────────────────────────────────────────────────────────────────┘
```

### Capa 3: Estados de Pagos (Invoices)

```
┌────────────────┬──────────────────┬──────────┐
│ Estado Pago MP │ Implementado     │ Estado   │
├────────────────┼──────────────────┼──────────┤
│ approved       │ ❌ No            │ FALTA    │
│ rejected       │ ❌ No            │ FALTA    │
│ pending        │ ❌ No            │ FALTA    │
│ in_process     │ ❌ No            │ FALTA    │
│ cancelled      │ ❌ No            │ FALTA    │
│ refunded       │ ❌ No            │ FALTA    │
│ charged_back   │ ❌ No            │ FALTA    │
└────────────────┴──────────────────┴──────────┘
```

## 🔥 Acción INMEDIATA Requerida

```
┌─────────────────────────────────────────────────────────────────┐
│  PASO 1: Agregar control de trial (5 minutos)                  │
│  ═════════════════════════════════════════════                 │
│                                                                 │
│  1. Ir a Supabase SQL Editor                                   │
│  2. Ejecutar: scripts/add-trial-used-to-stores.sql            │
│  3. Verificar resultado                                        │
│                                                                 │
│  Impacto: CRÍTICO ⭐⭐⭐                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PASO 2: Modificar código (15 minutos)                         │
│  ═════════════════════════════════════════════                 │
│                                                                 │
│  Archivos a editar:                                            │
│  • lib/types/subscription.ts                                   │
│  • app/api/subscription/create/route.ts                        │
│  • app/api/webhooks/mercadopago/route.ts                       │
│                                                                 │
│  Impacto: CRÍTICO ⭐⭐⭐                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PASO 3: Verificar estados actuales (2 minutos)                │
│  ═════════════════════════════════════════════                 │
│                                                                 │
│  1. Ir a Supabase SQL Editor                                   │
│  2. Ejecutar: scripts/diagnostico-estados-suscripciones.sql   │
│  3. Revisar resultados                                         │
│                                                                 │
│  Impacto: DIAGNÓSTICO ⭐⭐                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 📈 Flujo de Estados Recomendado

```
NUEVO USUARIO
    │
    ├─► [1] Crea cuenta
    │        │
    │        ├─► Estado: pending
    │        │   trial_used: false
    │        │
    │        ├─► [2] Autoriza en MP
    │        │        │
    │        │        ├─► Estado: trial
    │        │        │   trial_used: TRUE ✅
    │        │        │   Duración: 30 días
    │        │        │
    │        │        └─► [3a] Cancela en trial
    │        │        │        │
    │        │        │        ├─► Estado: cancelled
    │        │        │        │   trial_used: TRUE (sigue)
    │        │        │        │
    │        │        │        └─► [4] Vuelve a suscribirse
    │        │        │                 │
    │        │        │                 └─► Ve plan SIN trial ✅
    │        │        │
    │        │        └─► [3b] Trial expira
    │        │                 │
    │        │                 ├─► [Pago OK]
    │        │                 │    │
    │        │                 │    └─► Estado: active
    │        │                 │
    │        │                 └─► [Pago FALLA]
    │        │                      │
    │        │                      └─► Estado: past_due
    │        │                           (pierde acceso)
    │        │
    │        └─► [2b] No autoriza
    │                 │
    │                 └─► Estado: pending
    │                     trial_used: false (sigue)
    │                     (puede reintentar)
```

## 🎓 Comparación: Antes vs Después

### ❌ ANTES (Vulnerable)

```
Usuario crea cuenta → trial → cancela
    ↓
Crea otra cuenta → trial → cancela
    ↓
Crea otra cuenta → trial → cancela
    ↓
    ♾️ INFINITO
```

### ✅ DESPUÉS (Protegido)

```
Usuario crea cuenta → trial → trial_used=TRUE
    ↓
Cancela
    ↓
Vuelve → SOLO plan sin trial
    ↓
    🛡️ PROTEGIDO
```

## 📋 Checklist Rápido

```
[ ] Ejecutar add-trial-used-to-stores.sql
[ ] Actualizar Store type en TypeScript
[ ] Modificar /api/subscription/create
[ ] Modificar /api/webhooks/mercadopago
[ ] Ejecutar diagnóstico de estados
[ ] Verificar en Supabase
```

## 📚 Documentos Relacionados

```
docs/
├── ANALISIS-IMPLEMENTACION-SUSCRIPCIONES.md  (Análisis completo)
├── PLAN-DE-ACCION.md                          (Plan detallado)
└── RESUMEN-VISUAL.md                          (Este documento)

scripts/
├── add-trial-used-to-stores.sql              (Migración crítica)
└── diagnostico-estados-suscripciones.sql     (Diagnóstico)
```

---

**Próximo paso:** Ejecutar `add-trial-used-to-stores.sql` en Supabase  
**Tiempo estimado:** 5 minutos  
**Prioridad:** 🔥 CRÍTICA
