-- ============================================================================
-- REPORTE COMPLETO: Configuraciones de Suscripción de MercadoPago
-- ============================================================================
-- Este script muestra todas las configuraciones de suscripción registradas
-- en la plataforma, incluyendo planes y suscripciones activas

-- ============================================================================
-- 1. PLANES DE SUSCRIPCIÓN CONFIGURADOS
-- ============================================================================
SELECT 
  '=== PLANES DE SUSCRIPCIÓN ===' as seccion;

SELECT 
  id,
  name as nombre_interno,
  display_name as nombre_display,
  price as precio,
  billing_frequency as frecuencia_cobro,
  trial_period_days as dias_trial,
  mercadopago_plan_id as mp_plan_id,
  is_active as activo,
  created_at as fecha_creacion,
  updated_at as ultima_actualizacion
FROM subscription_plans
ORDER BY created_at DESC;

-- ============================================================================
-- 2. SUSCRIPCIONES ACTIVAS
-- ============================================================================
SELECT 
  '=== SUSCRIPCIONES ACTIVAS ===' as seccion;

SELECT 
  s.id,
  s.store_id,
  st.name as tienda_nombre,
  s.status as estado,
  s.mercadopago_preapproval_id as mp_preapproval_id,
  s.mercadopago_subscription_id as mp_subscription_id,
  sp.display_name as plan_nombre,
  sp.price as precio_plan,
  s.trial_started_at as inicio_trial,
  s.trial_ends_at as fin_trial,
  s.billing_started_at as inicio_facturacion,
  s.next_billing_date as proxima_fecha_cobro,
  s.auto_renewal as renovacion_automatica,
  s.created_at as fecha_creacion,
  s.updated_at as ultima_actualizacion
FROM subscriptions s
LEFT JOIN stores st ON s.store_id = st.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.status IN ('trial', 'active')
ORDER BY s.created_at DESC;

-- ============================================================================
-- 3. HISTORIAL COMPLETO DE SUSCRIPCIONES
-- ============================================================================
SELECT 
  '=== HISTORIAL COMPLETO DE SUSCRIPCIONES ===' as seccion;

SELECT 
  s.id,
  s.store_id,
  st.name as tienda_nombre,
  st.owner_id as usuario_id,
  s.status as estado,
  s.mercadopago_preapproval_id as mp_preapproval_id,
  sp.display_name as plan_nombre,
  sp.mercadopago_plan_id as mp_plan_id_usado,
  sp.price as precio,
  s.trial_started_at as inicio_trial,
  s.trial_ends_at as fin_trial,
  s.billing_started_at as inicio_facturacion,
  s.cancelled_at as fecha_cancelacion,
  s.cancellation_reason as motivo_cancelacion,
  s.created_at as fecha_creacion
FROM subscriptions s
LEFT JOIN stores st ON s.store_id = st.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
ORDER BY s.created_at DESC;

-- ============================================================================
-- 4. ESTADÍSTICAS GENERALES
-- ============================================================================
SELECT 
  '=== ESTADÍSTICAS GENERALES ===' as seccion;

SELECT 
  COUNT(*) FILTER (WHERE status = 'trial') as suscripciones_trial,
  COUNT(*) FILTER (WHERE status = 'active') as suscripciones_activas,
  COUNT(*) FILTER (WHERE status = 'pending') as suscripciones_pendientes,
  COUNT(*) FILTER (WHERE status = 'cancelled') as suscripciones_canceladas,
  COUNT(*) FILTER (WHERE status = 'expired') as suscripciones_expiradas,
  COUNT(*) FILTER (WHERE status = 'suspended') as suscripciones_suspendidas,
  COUNT(*) FILTER (WHERE status = 'past_due') as suscripciones_vencidas,
  COUNT(*) as total_suscripciones
FROM subscriptions;

-- ============================================================================
-- 5. TIENDAS Y SU ESTADO DE SUSCRIPCIÓN
-- ============================================================================
SELECT 
  '=== TIENDAS Y ESTADO DE SUSCRIPCIÓN ===' as seccion;

SELECT 
  st.id as store_id,
  st.name as tienda_nombre,
  st.slug as tienda_slug,
  st.trial_used as trial_usado,
  s.status as estado_suscripcion,
  s.mercadopago_preapproval_id as mp_preapproval_id,
  sp.display_name as plan_actual,
  CASE 
    WHEN s.trial_ends_at IS NOT NULL AND s.trial_ends_at > NOW() THEN
      EXTRACT(DAY FROM (s.trial_ends_at - NOW()))
    ELSE 0
  END as dias_trial_restantes,
  s.next_billing_date as proxima_facturacion,
  s.created_at as fecha_suscripcion
FROM stores st
LEFT JOIN subscriptions s ON st.id = s.store_id AND s.status IN ('trial', 'active')
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
ORDER BY st.created_at DESC;

-- ============================================================================
-- 6. CONFIGURACIÓN DE PLANES DE MP (Variables de Entorno)
-- ============================================================================
SELECT 
  '=== CONFIGURACIÓN DE PLANES MP ===' as seccion;

SELECT 
  name as plan_nombre,
  mercadopago_plan_id as mp_plan_id,
  trial_period_days as dias_trial,
  CASE 
    WHEN trial_period_days > 0 THEN 'CON TRIAL'
    ELSE 'SIN TRIAL'
  END as tipo_plan,
  CASE 
    WHEN mercadopago_plan_id IS NOT NULL AND mercadopago_plan_id != '' THEN '✅ Configurado'
    ELSE '❌ Sin configurar'
  END as estado_configuracion
FROM subscription_plans
ORDER BY trial_period_days DESC;

-- ============================================================================
-- 7. VERIFICAR IDs DE MP DUPLICADOS
-- ============================================================================
SELECT 
  '=== VERIFICACIÓN DE IDs DUPLICADOS ===' as seccion;

SELECT 
  mercadopago_plan_id,
  COUNT(*) as cantidad_planes,
  STRING_AGG(name, ', ') as planes_afectados
FROM subscription_plans
WHERE mercadopago_plan_id IS NOT NULL 
  AND mercadopago_plan_id != ''
GROUP BY mercadopago_plan_id
HAVING COUNT(*) > 1;

-- ============================================================================
-- 8. PAGOS RECIENTES (si existe la tabla)
-- ============================================================================
SELECT 
  '=== PAGOS RECIENTES ===' as seccion;

-- Verificar si existe la tabla de pagos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_payments') THEN
    RAISE NOTICE 'Tabla subscription_payments existe';
  ELSE
    RAISE NOTICE 'Tabla subscription_payments NO existe';
  END IF;
END $$;

-- Si existe, mostrar pagos
SELECT 
  sp.id,
  sp.subscription_id,
  sp.mercadopago_payment_id,
  sp.amount as monto,
  sp.status as estado_pago,
  sp.payment_date as fecha_pago,
  sp.billing_period_start as periodo_inicio,
  sp.billing_period_end as periodo_fin,
  s.store_id,
  st.name as tienda_nombre
FROM subscription_payments sp
LEFT JOIN subscriptions s ON sp.subscription_id = s.id
LEFT JOIN stores st ON s.store_id = st.id
ORDER BY sp.created_at DESC
LIMIT 20;
