# ✅ Checklist de Implementación: Sistema de Suscripciones
## Renovaciones Sin Trial + Control de Abuso

**Fecha:** 18 de diciembre de 2025  
**Objetivo:** Implementar control de trial y renovaciones sin trial

---

## 📋 PRE-REQUISITOS

### Verificar configuración actual

- [ ] **Verificar plan con trial en MercadoPago**
  \`\`\`bash
  # ¿Cuál es el ID del plan que TIENE trial?
  # Guardarlo para NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID
  \`\`\`

- [ ] **Confirmar plan sin trial**
  \`\`\`bash
  # Plan sin trial: 946bf6e3186741b5b7b8accbbdf646a5
  # Verificar en: https://www.mercadopago.com.ar/subscriptions/plans
  \`\`\`

- [ ] **Backup de base de datos**
  \`\`\`bash
  # En Supabase: Settings > Database > Backups
  # O ejecutar:
  pg_dump -h [HOST] -U postgres -d [DB_NAME] > backup_$(date +%Y%m%d).sql
  \`\`\`

---

## 🔧 FASE 1: BASE DE DATOS (30 min)

### 1.1 Ejecutar migración SQL

- [ ] **Abrir Supabase SQL Editor**
  - Ir a: https://app.supabase.com/project/[TU_PROJECT]/editor

- [ ] **Copiar contenido de `scripts/add-trial-used-to-stores.sql`**

- [ ] **Ejecutar en SQL Editor**

- [ ] **Verificar columnas creadas**
  \`\`\`sql
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'stores' 
    AND column_name IN ('trial_used', 'trial_used_at');
  \`\`\`
  **Resultado esperado:** 2 filas

- [ ] **Verificar tiendas marcadas**
  \`\`\`sql
  SELECT 
    id, 
    name, 
    trial_used, 
    trial_used_at 
  FROM stores 
  WHERE trial_used = true;
  \`\`\`
  **Resultado esperado:** Tiendas con suscripciones existentes marcadas

- [ ] **Verificar índice creado**
  \`\`\`sql
  SELECT indexname, indexdef 
  FROM pg_indexes 
  WHERE tablename = 'stores' 
    AND indexname = 'idx_stores_trial_used';
  \`\`\`
  **Resultado esperado:** 1 fila con el índice

---

## 📝 FASE 2: CONFIGURACIÓN (15 min)

### 2.1 Agregar variable de entorno

- [ ] **Editar `.env.local`**
  \`\`\`bash
  # Agregar esta línea con el ID de tu plan CON trial:
  NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID="[TU_PLAN_ID_AQUI]"
  \`\`\`

- [ ] **Reiniciar servidor de desarrollo**
  \`\`\`bash
  # Detener (Ctrl+C) y volver a iniciar:
  npm run dev
  # o
  pnpm dev
  \`\`\`

### 2.2 Verificar archivo de constantes creado

- [ ] **Confirmar que existe:** `lib/config/subscription-plans.ts`
  \`\`\`bash
  ls -la lib/config/subscription-plans.ts
  \`\`\`

- [ ] **Revisar configuración** (abrir archivo y verificar)

---

## 💻 FASE 3: BACKEND - API (45 min)

### 3.1 Modificar `/api/subscription/create/route.ts`

- [ ] **Importar configuración de planes**
  \`\`\`typescript
  import { 
    MERCADOPAGO_PLANS, 
    getPlanTypeByHistory, 
    generateCheckoutUrl,
    STATES_WITH_TRIAL_USED 
  } from '@/lib/config/subscription-plans'
  \`\`\`

- [ ] **Agregar lógica de detección de trial usado** (ANTES de crear suscripción)
  \`\`\`typescript
  // Verificar si la tienda tiene historial
  const { data: previousSubscriptions } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('store_id', storeId)
    .in('status', STATES_WITH_TRIAL_USED)
    .limit(1)

  const hasUsedTrial = previousSubscriptions && previousSubscriptions.length > 0
  \`\`\`

- [ ] **Seleccionar plan correcto**
  \`\`\`typescript
  const planType = getPlanTypeByHistory(hasUsedTrial)
  const mercadoPagoPlanId = MERCADOPAGO_PLANS[planType].id
  \`\`\`

- [ ] **Ajustar trial_days según plan**
  \`\`\`typescript
  const trialDays = hasUsedTrial ? 0 : 7
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)
  \`\`\`

- [ ] **Actualizar creación de suscripción**
  \`\`\`typescript
  const { data: subscription } = await supabase
    .from('subscriptions')
    .insert({
      store_id: storeId,
      plan_id: planId,
      status: 'pending',
      trial_started_at: trialDays > 0 ? new Date().toISOString() : null,
      trial_ends_at: trialDays > 0 ? trialEndsAt.toISOString() : null,
      auto_renewal: true
    })
  \`\`\`

- [ ] **Usar plan correcto en URL de checkout**
  \`\`\`typescript
  const backUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/subscription/success?subscription_id=${subscription.id}`
  const checkoutUrl = generateCheckoutUrl(planType, backUrl)
  \`\`\`

- [ ] **Agregar logging**
  \`\`\`typescript
  console.log(`🔍 Store ${storeId}: hasUsedTrial=${hasUsedTrial}, plan=${planType}, trialDays=${trialDays}`)
  \`\`\`

- [ ] **Retornar info de plan usado**
  \`\`\`typescript
  return NextResponse.json({
    success: true,
    subscription,
    init_point: checkoutUrl,
    trial_days: trialDays,
    plan_type: planType  // Para debugging
  })
  \`\`\`

### 3.2 Modificar `/api/webhooks/mercadopago/route.ts`

- [ ] **Agregar lógica para marcar trial_used** (en función `handleSubscriptionUpdate`)
  \`\`\`typescript
  // Cuando la suscripción pasa a authorized
  if (mpData.status === 'authorized') {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('store_id')
      .eq('mercadopago_preapproval_id', preapprovalId)
      .single()
    
    if (subscription) {
      // Marcar trial_used = true (solo si no estaba marcado)
      await supabase
        .from('stores')
        .update({
          trial_used: true,
          trial_used_at: new Date().toISOString()
        })
        .eq('id', subscription.store_id)
        .eq('trial_used', false)  // Solo la primera vez
      
      console.log(`✅ Store ${subscription.store_id}: trial_used marked as true`)
    }
  }
  \`\`\`

- [ ] **Agregar logging de estado MP recibido**
  \`\`\`typescript
  console.log(`📥 Webhook received: preapproval=${preapprovalId}, status=${mpData.status}`)
  \`\`\`

---

## 🎨 FASE 4: FRONTEND - UI (45 min)

### 4.1 Actualizar `components/admin/subscription-status.tsx`

- [ ] **Agregar botón para estado `expired`**
  \`\`\`tsx
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
  \`\`\`

- [ ] **Agregar botón para estado `cancelled`**
  \`\`\`tsx
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
  \`\`\`

- [ ] **Actualizar botón para estado `suspended`** (cambiar link a /admin/plans)
  \`\`\`tsx
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
  \`\`\`

- [ ] **Agregar botón para estado `past_due`**
  \`\`\`tsx
  {subscriptionData.status === 'past_due' && (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
      <h4 className="text-lg font-semibold text-orange-800 mb-2">
        Pago Pendiente
      </h4>
      <p className="text-sm text-orange-700 mb-4">
        Tu suscripción tiene un pago vencido. Actualizá tu medio de pago.
      </p>
      <Link href="/admin/subscription/plans">
        <Button className="w-full">
          Actualizar Medio de Pago
        </Button>
      </Link>
    </div>
  )}
  \`\`\`

### 4.2 Crear página de planes `/admin/subscription/plans/page.tsx`

- [ ] **Crear estructura de directorios**
  \`\`\`bash
  mkdir -p app/admin/subscription/plans
  \`\`\`

- [ ] **Crear archivo `page.tsx`** con componente de suscripción
  - Mostrar plan mensual
  - Botón "Suscribirme" que llama a `/api/subscription/create`
  - Manejar redirección a MercadoPago

- [ ] **Obtener storeId y email del usuario actual**
  - Usar contexto de sesión
  - O consultar desde API

---

## 🧪 FASE 5: TESTING (60 min)

### 5.1 Test Unitario: Detección de trial usado

- [ ] **Test con usuario nuevo**
  \`\`\`bash
  # En Supabase SQL Editor:
  # 1. Crear tienda de prueba sin suscripciones
  INSERT INTO stores (name, slug, owner_id, trial_used) 
  VALUES ('Test Store New', 'test-store-new', 'TEST_USER_ID', false);
  
  # 2. Llamar a API /subscription/create con ese storeId
  # 3. Verificar logs: debe mostrar hasUsedTrial=false, plan=WITH_TRIAL
  \`\`\`

- [ ] **Test con usuario expirado**
  \`\`\`bash
  # 1. Crear tienda con suscripción expirada
  INSERT INTO stores (name, slug, owner_id, trial_used) 
  VALUES ('Test Store Expired', 'test-store-expired', 'TEST_USER_ID', true);
  
  INSERT INTO subscriptions (store_id, plan_id, status, trial_ends_at) 
  VALUES ('[STORE_ID]', 'monthly', 'expired', NOW() - INTERVAL '1 day');
  
  # 2. Llamar a API /subscription/create
  # 3. Verificar logs: debe mostrar hasUsedTrial=true, plan=WITHOUT_TRIAL
  \`\`\`

### 5.2 Test E2E: Flujo completo

- [ ] **Usuario nuevo se suscribe**
  1. Crear cuenta nueva
  2. Ir a `/admin/subscription`
  3. Click "Suscribirme" → debe ir a `/admin/subscription/plans`
  4. Click "Suscribirme Ahora"
  5. Verificar en MP: debe mostrar "7 días de prueba gratuita"
  6. **NO COMPLETAR el pago todavía** (para no gastar dinero en test)

- [ ] **Usuario expirado renueva**
  1. Usar cuenta con estado `expired`
  2. Click "Ver Planes"
  3. Click "Suscribirme Ahora"
  4. Verificar en MP: **NO debe mostrar trial**, pago inmediato
  5. **NO COMPLETAR el pago**

- [ ] **Verificar logs de consola**
  \`\`\`bash
  # En terminal del servidor, buscar:
  🔍 Store [ID]: hasUsedTrial=false, plan=WITH_TRIAL, trialDays=7
  🔍 Store [ID]: hasUsedTrial=true, plan=WITHOUT_TRIAL, trialDays=0
  \`\`\`

### 5.3 Test de Webhook

- [ ] **Simular webhook de MercadoPago**
  \`\`\`bash
  # Usar herramienta como Postman o curl:
  curl -X POST http://localhost:3000/api/webhooks/mercadopago \
    -H "Content-Type: application/json" \
    -d '{
      "type": "subscription_preapproval",
      "data": {
        "id": "TEST_PREAPPROVAL_ID"
      }
    }'
  \`\`\`

- [ ] **Verificar que trial_used se marca**
  \`\`\`sql
  SELECT id, name, trial_used, trial_used_at 
  FROM stores 
  WHERE id = '[STORE_ID]';
  \`\`\`

---

## 📊 FASE 6: VALIDACIÓN EN PRODUCCIÓN (30 min)

### 6.1 Deploy a producción

- [ ] **Commit de cambios**
  \`\`\`bash
  git add .
  git commit -m "feat: Implementar control de trial y renovaciones sin trial"
  git push origin main
  \`\`\`

- [ ] **Verificar despliegue exitoso**
  - Vercel/Railway/etc debe completar el build

### 6.2 Ejecutar migración en producción

- [ ] **Abrir Supabase SQL Editor (PRODUCCIÓN)**

- [ ] **Ejecutar `add-trial-used-to-stores.sql`**

- [ ] **Verificar tiendas marcadas**
  \`\`\`sql
  SELECT COUNT(*) as total, 
         COUNT(CASE WHEN trial_used THEN 1 END) as con_trial_usado
  FROM stores;
  \`\`\`

### 6.3 Monitorear primeras suscripciones

- [ ] **Verificar logs en tiempo real**
  - Vercel: https://vercel.com/[proyecto]/logs
  - Railway: Railway Dashboard > Logs

- [ ] **Buscar líneas de log:**
  \`\`\`
  🔍 Store [ID]: hasUsedTrial=...
  ✅ Store [ID]: trial_used marked as true
  \`\`\`

- [ ] **Verificar estados en DB**
  \`\`\`sql
  SELECT 
    s.store_id,
    st.trial_used,
    s.status,
    s.trial_ends_at,
    s.created_at
  FROM subscriptions s
  JOIN stores st ON st.id = s.store_id
  WHERE s.created_at > NOW() - INTERVAL '1 hour'
  ORDER BY s.created_at DESC;
  \`\`\`

---

## 📈 FASE 7: MONITOREO POST-DEPLOY (Continuo)

### 7.1 Queries de monitoreo diario

- [ ] **Suscripciones creadas hoy**
  \`\`\`sql
  SELECT 
    COUNT(*) as total_hoy,
    COUNT(CASE WHEN trial_ends_at > NOW() THEN 1 END) as con_trial,
    COUNT(CASE WHEN trial_ends_at IS NULL THEN 1 END) as sin_trial
  FROM subscriptions
  WHERE created_at >= CURRENT_DATE;
  \`\`\`

- [ ] **Tiendas que pueden renovar**
  \`\`\`sql
  SELECT 
    s.id,
    s.name,
    sub.status,
    s.trial_used
  FROM stores s
  JOIN subscriptions sub ON sub.store_id = s.id
  WHERE sub.status IN ('expired', 'cancelled', 'suspended', 'past_due')
  ORDER BY sub.updated_at DESC;
  \`\`\`

### 7.2 Alertas a configurar

- [ ] **Alerta si usuario nuevo obtiene plan sin trial** (posible bug)
  \`\`\`sql
  -- Si esta query retorna filas, hay un problema:
  SELECT 
    s.store_id,
    s.trial_ends_at,
    st.trial_used
  FROM subscriptions s
  JOIN stores st ON st.id = s.store_id
  WHERE s.created_at > NOW() - INTERVAL '1 hour'
    AND st.trial_used = false
    AND s.trial_ends_at IS NULL;  -- Sin trial cuando no debería
  \`\`\`

- [ ] **Alerta si usuario expirado obtiene plan con trial** (posible bug)
  \`\`\`sql
  -- Si esta query retorna filas, hay un problema:
  SELECT 
    s.store_id,
    s.trial_ends_at,
    st.trial_used
  FROM subscriptions s
  JOIN stores st ON st.id = s.store_id
  WHERE s.created_at > NOW() - INTERVAL '1 hour'
    AND st.trial_used = true
    AND s.trial_ends_at > NOW();  -- Con trial cuando no debería
  \`\`\`

---

## ✅ CHECKLIST FINAL DE VALIDACIÓN

### Funcionalidad básica
- [ ] Usuario nuevo puede suscribirse con trial de 7 días
- [ ] Usuario expirado puede renovar sin trial
- [ ] Usuario cancelado puede renovar sin trial
- [ ] Usuario suspendido puede reactivar sin trial
- [ ] Campo `trial_used` se marca correctamente en primera autorización

### UI/UX
- [ ] Estado `expired` muestra botón "Ver Planes"
- [ ] Estado `cancelled` muestra botón "Renovar Suscripción"
- [ ] Estado `suspended` muestra botón "Reactivar"
- [ ] Estado `past_due` muestra botón "Actualizar Pago"
- [ ] Todos los botones llevan a `/admin/subscription/plans`

### Backend
- [ ] API `/subscription/create` detecta trial usado correctamente
- [ ] API selecciona plan correcto (con/sin trial)
- [ ] Webhook marca `trial_used = true` en authorized
- [ ] Logs muestran información de debugging

### Base de datos
- [ ] Campo `trial_used` existe en tabla `stores`
- [ ] Campo `trial_used_at` existe en tabla `stores`
- [ ] Índice `idx_stores_trial_used` creado
- [ ] Tiendas existentes marcadas correctamente

### Configuración
- [ ] Variable `NEXT_PUBLIC_MERCADOPAGO_PLAN_WITH_TRIAL_ID` configurada
- [ ] Archivo `lib/config/subscription-plans.ts` creado
- [ ] Plan sin trial hardcodeado: `946bf6e3186741b5b7b8accbbdf646a5`

### Documentación
- [ ] README actualizado con nueva lógica
- [ ] Docs de análisis creados:
  - `ANALISIS-IMPLEMENTACION-SUSCRIPCIONES.md`
  - `ANALISIS-RENOVACIONES-SIN-TRIAL.md`
  - `PLAN-DE-ACCION.md`
  - `RESUMEN-VISUAL-V2.md`

---

## 🚨 ROLLBACK (Si algo sale mal)

### Si hay problemas en producción:

1. **Revertir cambios de código:**
   \`\`\`bash
   git revert HEAD
   git push origin main
   \`\`\`

2. **Revertir migración SQL** (si es necesario):
   \`\`\`sql
   ALTER TABLE stores DROP COLUMN IF EXISTS trial_used;
   ALTER TABLE stores DROP COLUMN IF EXISTS trial_used_at;
   DROP INDEX IF EXISTS idx_stores_trial_used;
   \`\`\`

3. **Notificar a usuarios afectados** (si hubo suscripciones incorrectas)

---

## 📞 SOPORTE POST-IMPLEMENTACIÓN

### Preguntas frecuentes esperadas:

**Q: ¿Por qué no veo el período de prueba?**  
A: Si ya usaste tu período de prueba antes, no podés usarlo de nuevo. Esto previene abusos.

**Q: Cancelé mi suscripción, ¿puedo volver?**  
A: Sí, podés volver a suscribirte en cualquier momento, pero sin período de prueba.

**Q: ¿Puedo crear otra tienda para obtener otro trial?**  
A: No, el control es por usuario. Si ya usaste trial en alguna tienda, no podés usarlo de nuevo.

---

**Autor:** GitHub Copilot  
**Última actualización:** 18 de diciembre de 2025  
**Tiempo estimado total:** 4-6 horas
