# 🚀 Guía de Implementación Rápida

## Sistema de Control de Trial y Renovaciones

**Fecha:** 18 de diciembre de 2025  
**Duración estimada:** 15-30 minutos

---

## ✅ Implementación Completada

Los siguientes archivos ya han sido creados/modificados:

### Archivos Nuevos
- ✅ `lib/config/subscription-plans.ts` - Configuración centralizada de planes
- ✅ `app/admin/subscription/plans/page.tsx` - Página de suscripción
- ✅ `scripts/diagnostico-post-migracion.sql` - Script de verificación
- ✅ Documentación completa en `docs/`

### Archivos Modificados
- ✅ `.env.local` - Variables de entorno agregadas
- ✅ `app/api/subscription/create/route.ts` - Lógica de selección de plan
- ✅ `app/api/webhooks/mercadopago/route.ts` - Marcado de trial_used
- ✅ `components/admin/subscription-status.tsx` - UI actualizada

---

## 🔧 Pasos Pendientes (DEBES HACER)

### 1️⃣ Ejecutar Migración SQL (⭐ CRÍTICO)

**En Supabase SQL Editor:**

```sql
-- Copiar y ejecutar: scripts/add-trial-used-to-stores.sql
```

**O ejecutar directamente este código:**

```sql
-- Agregar campos
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMP NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_stores_trial_used 
  ON stores(trial_used) 
  WHERE trial_used = false;

-- Marcar tiendas con historial
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
  WHERE status IN ('trial', 'active', 'cancelled', 'expired', 'suspended', 'past_due')
);
```

### 2️⃣ Verificar Migración

**Ejecutar script de diagnóstico:**

```sql
-- Copiar y ejecutar: scripts/diagnostico-post-migracion.sql
```

**Verificación rápida:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'stores' AND column_name = 'trial_used';
-- Debe retornar 1 fila
```

### 3️⃣ Reiniciar Servidor de Desarrollo

```bash
# Detener el servidor (Ctrl+C)
# Volver a iniciar para cargar las nuevas variables de entorno
pnpm dev
# o
npm run dev
```

### 4️⃣ Verificar Variables de Entorno

Abrir `.env.local` y confirmar que estén estas líneas:

```bash
# Debe estar presente:
NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID=921acee62b484deaa5120e39733ab2ee
NEXT_PUBLIC_MERCADOPAGO_PLAN_WITHOUT_TRIAL_ID=946bf6e3186741b5b7b8accbbdf646a5
```

---

## 🧪 Testing Rápido

### Test 1: Verificar que no hay errores de compilación

```bash
pnpm build
# o
npm run build
```

**Resultado esperado:** Build exitoso sin errores

### Test 2: Verificar página de planes

1. Iniciar servidor: `pnpm dev`
2. Abrir: http://localhost:3000/admin/subscription/plans
3. Verificar que la página se carga correctamente

### Test 3: Verificar selección de plan (sin pagar)

1. Desde una cuenta de prueba, ir a `/admin/subscription/plans`
2. Click en "Suscribirme Ahora"
3. Verificar en la consola del navegador:
   ```
   ✅ Suscripción creada: { plan_type: 'WITH_TRIAL', trial_days: 7, ... }
   ```
4. **NO COMPLETAR el pago** en MercadoPago

---

## 📋 Checklist Final

Marcar cuando esté completo:

- [ ] Migración SQL ejecutada en Supabase
- [ ] Columnas `trial_used` y `trial_used_at` existen
- [ ] Variables de entorno configuradas
- [ ] Servidor reiniciado
- [ ] Build exitoso
- [ ] Página `/admin/subscription/plans` funciona
- [ ] Logs muestran plan correcto en consola

---

## 🎯 Cómo Funciona Ahora

### Usuario Nuevo (Primera vez)
```
Usuario → /admin/subscription/plans → Click "Suscribirme"
  ↓
API detecta: hasUsedTrial = false
  ↓
Selecciona: Plan CON trial (7 días)
  ↓
Redirige a MercadoPago con plan: 921acee62b484deaa5120e39733ab2ee
```

### Usuario Expirado (Renovación)
```
Usuario → /admin/subscription/plans → Click "Suscribirme"
  ↓
API detecta: hasUsedTrial = true (tiene historial)
  ↓
Selecciona: Plan SIN trial (pago inmediato)
  ↓
Redirige a MercadoPago con plan: 946bf6e3186741b5b7b8accbbdf646a5
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module subscription-plans"

**Solución:**
```bash
# Reiniciar el servidor
# Ctrl+C y volver a ejecutar:
pnpm dev
```

### Error: "trial_used column does not exist"

**Solución:** Ejecutar migración SQL en Supabase

### Build falla con errores de TypeScript

**Solución:** Verificar que `lib/config/subscription-plans.ts` existe

---

## 📚 Documentación Completa

Para más detalles, consultar:

- `docs/CHECKLIST-IMPLEMENTACION.md` - Guía paso a paso completa
- `docs/ANALISIS-RENOVACIONES-SIN-TRIAL.md` - Análisis técnico
- `docs/RESUMEN-VISUAL-V2.md` - Diagramas y flujos

---

## 🚀 Deploy a Producción

Cuando todo funcione en desarrollo:

```bash
# 1. Commit
git add .
git commit -m "feat: Implementar control de trial y renovaciones sin trial"

# 2. Push
git push origin main

# 3. Ejecutar migración en Supabase PRODUCCIÓN
# Ir a Supabase Dashboard > SQL Editor
# Ejecutar: scripts/add-trial-used-to-stores.sql

# 4. Verificar deployment
# Vercel/Railway/etc completará el build automáticamente
```

---

## 📞 Soporte

Si tenés dudas o problemas:

1. Revisar logs en consola del navegador
2. Revisar logs del servidor
3. Ejecutar script de diagnóstico SQL
4. Consultar documentación en `docs/`

---

**¡Listo para usar! 🎉**
