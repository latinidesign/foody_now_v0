# 🔧 Correcciones de Suscripción - 22 Dic 2025

## Problemas Identificados y Solucionados

### 1. ❌ Error: "Plan no encontrado" 
**Problema:** El endpoint de creación de suscripción buscaba planes por `name` pero recibía UUID.

**Archivo:** `/app/api/subscription/create/route.ts`

**Solución:**
\`\`\`typescript
// Antes: Solo buscaba por 'name'
.eq("name", selectedPlanId)

// Ahora: Detecta si es UUID y busca por el campo correcto
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedPlanId)
.eq(isUUID ? "id" : "name", selectedPlanId)
\`\`\`

### 2. ❌ Precio incorrecto mostrado: $3.000
**Problema:** La página de planes mostraba $3.000 en lugar de $36.000

**Archivo:** `/app/admin/subscription/plans/page.tsx`

**Solución:**
\`\`\`tsx
// Antes
<span className="text-5xl font-bold">$3.000</span>

// Ahora
<span className="text-5xl font-bold">$36.000</span>
\`\`\`

### 3. ❌ PlanId incorrecto enviado
**Problema:** Se enviaba `planId: 'monthly'` que no existe en la base de datos

**Archivo:** `/app/admin/subscription/plans/page.tsx`

**Solución:**
\`\`\`typescript
// Antes
planId: 'monthly'

// Ahora
planId: 'basic_monthly'  // Nombre correcto del plan en la DB
\`\`\`

---

## 📋 Resumen de Cambios

### Archivos Modificados:

1. **`app/api/subscription/create/route.ts`**
   - ✅ Agregada detección de UUID vs nombre de plan
   - ✅ Búsqueda flexible por `id` o `name`
   - ✅ Mejor logging de errores

2. **`app/admin/subscription/plans/page.tsx`**
   - ✅ Precio corregido a $36.000
   - ✅ PlanId corregido a 'basic_monthly'

3. **`lib/config/subscription-plans.ts`**
   - ✅ Precio actualizado a 36000 ARS
   - ✅ Trial actualizado a 14 días

---

## ✅ Estado Actual

### Configuración de Planes:
- **Precio único:** $36.000 ARS/mes
- **Plan con trial:** 14 días gratuitos (primera suscripción)
- **Plan sin trial:** Renovaciones sin período de prueba

### IDs de MercadoPago:
- **Con trial:** `921acee62b484deaa5120e39733ab2ee`
- **Sin trial:** `946bf6e3186741b5b7b8accbbdf646a5`

### Plan en Base de Datos:
- **Nombre:** `basic_monthly`
- **UUID:** `20e79e7c-3ee9-4027-b7ae-c30488bf5dca`
- **Display:** "Plan Mensual FoodyNow"
- **Precio:** $36.000
- **Estado:** Activo ✅

---

## 🧪 Pruebas Realizadas

### Caso 1: Pizzería Don Mario (expirado)
- ✅ Página de renovación muestra precio correcto: $36.000
- ✅ Redirección a `/admin/subscription/plans` funcional
- ✅ Botón de pago ahora encuentra el plan correctamente

### Caso 2: Usuario latinidev@gmail.com
- ✅ Error "Plan no encontrado" solucionado
- ✅ El endpoint ahora acepta tanto UUID como nombre de plan
- ✅ Logs mejorados para debugging

---

## 🔄 Próximos Pasos Recomendados

1. **Hacer commit y push:**
\`\`\`bash
git add .
git commit -m "fix: corregir búsqueda de planes y precios de suscripción"
git push
\`\`\`

2. **Probar en producción:**
- Usuario con suscripción expirada → renovar
- Usuario nuevo → crear suscripción
- Verificar que ambos flujos funcionen correctamente

3. **Monitorear logs de Vercel:**
- Verificar que no haya más errores "Plan no encontrado"
- Confirmar que se están usando los planes correctos

---

## 📝 Notas Técnicas

### Validación de UUID
\`\`\`typescript
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedPlanId)
\`\`\`

Esta validación permite que el endpoint sea flexible y acepte:
- UUID completo del plan (ej: `20e79e7c-3ee9-4027-b7ae-c30488bf5dca`)
- Nombre del plan (ej: `basic_monthly`)

### Plan por Defecto
\`\`\`typescript
const selectedPlanId = planId || 'basic_monthly'
\`\`\`

Si no se envía ningún `planId`, se usa 'basic_monthly' por defecto.

---

**Fecha:** 22 de diciembre de 2025  
**Estado:** ✅ Todos los problemas resueltos  
**Prioridad:** Alta - Afecta renovaciones de suscripción
