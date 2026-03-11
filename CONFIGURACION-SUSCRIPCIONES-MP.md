# 📋 Configuración de Suscripciones MercadoPago - FoodyNow

## 🎯 Modelo de Negocio

FoodyNow tiene **UN ÚNICO PRECIO** y **DOS PLANES** de suscripción mensual:

- **Precio único:** $36,000 ARS/mes
- **Frecuencia:** Mensual (1 mes)

---

## 📦 Planes Configurados

### 1️⃣ Plan con Trial (Primera Suscripción)

**Para:** Nuevos usuarios que nunca han tenido una suscripción activa

\`\`\`typescript
{
  id: '921acee62b484deaa5120e39733ab2ee',
  nombre: 'Suscripción Mensual con Trial',
  descripcion: '14 días de prueba gratuita + Renovación mensual',
  precio: 36000,
  moneda: 'ARS',
  trial_dias: 14,
  frecuencia: 1,
  tipo_frecuencia: 'months'
}
\`\`\`

**Características:**
- ✅ 14 días de prueba gratuita
- ✅ Renovación automática después del trial
- ✅ Precio: $36,000/mes después del trial
- ✅ Se aplica cuando `trial_used = false` en la tienda

---

### 2️⃣ Plan sin Trial (Renovaciones)

**Para:** Usuarios que ya usaron el período de prueba

\`\`\`typescript
{
  id: '946bf6e3186741b5b7b8accbbdf646a5',
  nombre: 'Suscripción Mensual (Renovación)',
  descripcion: 'Renovación mensual sin período de prueba',
  precio: 36000,
  moneda: 'ARS',
  trial_dias: 0,
  frecuencia: 1,
  tipo_frecuencia: 'months'
}
\`\`\`

**Características:**
- ❌ Sin período de prueba
- ✅ Pago inmediato de $36,000
- ✅ Renovación automática mensual
- ✅ Se aplica cuando `trial_used = true` en la tienda

---

## 🔄 Lógica de Selección de Plan

El sistema selecciona automáticamente el plan correcto según el historial:

\`\`\`typescript
function getPlanTypeByHistory(hasUsedTrial: boolean): PlanType {
  return hasUsedTrial ? 'WITHOUT_TRIAL' : 'WITH_TRIAL'
}
\`\`\`

**Estados que indican trial usado:**
- `trial` - Actualmente en período de prueba
- `active` - Suscripción activa pagada
- `expired` - Suscripción expirada
- `cancelled` - Suscripción cancelada
- `suspended` - Suscripción suspendida
- `past_due` - Suscripción con pago vencido

---

## 🗂️ Configuración en Base de Datos

### Plan Activo en `subscription_plans`

\`\`\`sql
{
  id: '20e79e7c-3ee9-4027-b7ae-c30488bf5dca',
  name: 'basic_monthly',
  display_name: 'Plan Mensual FoodyNow',
  price: 36000,
  billing_frequency: 'monthly',
  trial_period_days: 14,
  mercadopago_plan_id: '921acee62b484deaa5120e39733ab2ee',
  is_active: true
}
\`\`\`

---

## ⚙️ Variables de Entorno Necesarias

\`\`\`bash
# .env.local

# Plan con trial (14 días)
NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID=921acee62b484deaa5120e39733ab2ee

# Token de acceso de MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx...

# URL de la aplicación
NEXT_PUBLIC_APP_URL=https://foodynow.com.ar
\`\`\`

---

## 📊 Estado Actual del Sistema

### Planes
- ✅ **1 plan activo** en la base de datos
- ✅ **2 planes configurados** en el código (con/sin trial)
- ✅ Precios sincronizados: $36,000 ARS

### Suscripciones
- 🔹 **1 suscripción en Trial**
- ⏳ **2 suscripciones Pendientes**
- ✅ **0 suscripciones Activas**
- **Total:** 3 suscripciones

---

## 🔗 URLs de Checkout

### Con Trial (Nuevos usuarios)
\`\`\`
https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=921acee62b484deaa5120e39733ab2ee&back_url=[URL_ENCODED]
\`\`\`

### Sin Trial (Renovaciones)
\`\`\`
https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=946bf6e3186741b5b7b8accbbdf646a5&back_url=[URL_ENCODED]
\`\`\`

---

## 📝 Archivos de Configuración

### Código
- **`/lib/config/subscription-plans.ts`** - Configuración centralizada de planes
- **`/app/api/subscription/create/route.ts`** - API de creación de suscripciones

### Scripts de Verificación
- **`show-mp-config.js`** - Mostrar todas las configuraciones
- **`view-all-mp-subscriptions.sql`** - Queries SQL detalladas

---

## ✅ Verificación

Para verificar que todo está correctamente configurado:

\`\`\`bash
# Ejecutar script de verificación
node show-mp-config.js

# O consultar directamente en la base de datos
# Copiar y ejecutar: view-all-mp-subscriptions.sql
\`\`\`

---

## 🎯 Resumen

- ✅ Precio único: **$36,000 ARS/mes**
- ✅ Trial: **14 días** (solo primera vez)
- ✅ Renovación: **Automática** sin trial
- ✅ Planes configurados en MercadoPago
- ✅ Variables de entorno configuradas
- ✅ Código sincronizado con base de datos

---

**Última actualización:** 22 de diciembre de 2025
