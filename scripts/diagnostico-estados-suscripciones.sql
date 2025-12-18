-- ============================================================================
-- CONSULTA: Estados actuales de suscripciones en FoodyNow
-- ============================================================================
-- Ejecutar en Supabase SQL Editor para diagnosticar estado actual
-- ============================================================================

-- 1️⃣ RESUMEN DE ESTADOS
-- ============================================================================
SELECT 
  '📊 RESUMEN DE ESTADOS DE SUSCRIPCIONES' as seccion,
  '' as separador;

SELECT 
  COALESCE(s.status, 'sin_suscripcion') as estado,
  COUNT(DISTINCT st.id) as cantidad_tiendas,
  ROUND(COUNT(DISTINCT st.id) * 100.0 / (SELECT COUNT(*) FROM stores), 2) as porcentaje,
  CASE 
    WHEN COALESCE(s.status, 'sin_suscripcion') = 'trial' THEN '🧪 Período de prueba'
    WHEN COALESCE(s.status, 'sin_suscripcion') = 'pending' THEN '⏳ Pendiente de pago'
    WHEN COALESCE(s.status, 'sin_suscripcion') = 'active' THEN '✅ Activa y pagando'
    WHEN COALESCE(s.status, 'sin_suscripcion') = 'past_due' THEN '⚠️ Pago vencido'
    WHEN COALESCE(s.status, 'sin_suscripcion') = 'suspended' THEN '⏸️ Suspendida'
    WHEN COALESCE(s.status, 'sin_suscripcion') = 'cancelled' THEN '❌ Cancelada'
    WHEN COALESCE(s.status, 'sin_suscripcion') = 'expired' THEN '💀 Expirada'
    ELSE '👤 Sin suscripción'
  END as descripcion
FROM stores st
LEFT JOIN subscriptions s ON s.store_id = st.id
GROUP BY COALESCE(s.status, 'sin_suscripcion')
ORDER BY cantidad_tiendas DESC;

-- 2️⃣ DETALLE DE TIENDAS ACTIVAS
-- ============================================================================
SELECT 
  '👥 TIENDAS CON SUSCRIPCIONES ACTIVAS (TRIAL + ACTIVE)' as seccion,
  '' as separador;

SELECT 
  st.id,
  st.name,
  st.slug,
  s.status,
  s.trial_started_at,
  s.trial_ends_at,
  CASE 
    WHEN s.status = 'trial' AND s.trial_ends_at > NOW() 
      THEN CONCAT(EXTRACT(DAY FROM s.trial_ends_at - NOW())::INTEGER, ' días')
    ELSE 'N/A'
  END as dias_trial_restantes,
  s.mercadopago_preapproval_id,
  s.created_at as suscripcion_desde,
  st.created_at as tienda_creada
FROM stores st
INNER JOIN subscriptions s ON s.store_id = st.id
WHERE s.status IN ('trial', 'active')
ORDER BY s.created_at DESC;

-- 3️⃣ PROBLEMAS POTENCIALES
-- ============================================================================
SELECT 
  '⚠️ PROBLEMAS POTENCIALES' as seccion,
  '' as separador;

-- 3.1 Trials expirados que no cambiaron de estado
SELECT 
  'Trial expirado sin cambio de estado' as problema,
  COUNT(*) as cantidad
FROM stores st
INNER JOIN subscriptions s ON s.store_id = st.id
WHERE s.status = 'trial' 
  AND s.trial_ends_at < NOW();

-- 3.2 Suscripciones pending hace más de 7 días (checkout incompleto)
SELECT 
  'Suscripciones pending hace >7 días' as problema,
  COUNT(*) as cantidad
FROM subscriptions s
WHERE s.status = 'pending'
  AND s.created_at < NOW() - INTERVAL '7 days';

-- 3.3 Verificar si existe campo trial_used (debería NO existir aún)
SELECT 
  'Campo trial_used existe en stores' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'stores' 
        AND column_name = 'trial_used'
    ) THEN '✅ SÍ (ya migrado)'
    ELSE '❌ NO (pendiente migración)'
  END as resultado;

-- 4️⃣ HISTORIAL DE SUSCRIPCIONES POR TIENDA
-- ============================================================================
SELECT 
  '📜 TIENDAS CON MÚLTIPLES SUSCRIPCIONES (POSIBLE ABUSO DE TRIAL)' as seccion,
  '' as separador;

SELECT 
  st.id,
  st.name,
  st.slug,
  COUNT(s.id) as cantidad_suscripciones,
  STRING_AGG(s.status::text, ', ' ORDER BY s.created_at) as estados,
  MIN(s.created_at) as primera_suscripcion,
  MAX(s.created_at) as ultima_suscripcion
FROM stores st
INNER JOIN subscriptions s ON s.store_id = st.id
GROUP BY st.id, st.name, st.slug
HAVING COUNT(s.id) > 1
ORDER BY cantidad_suscripciones DESC;

-- 5️⃣ ANÁLISIS DE PAGOS (si existe tabla subscription_payments)
-- ============================================================================
SELECT 
  '💳 ANÁLISIS DE PAGOS RECURRENTES' as seccion,
  '' as separador;

SELECT 
  sp.status as estado_pago,
  COUNT(*) as cantidad,
  ROUND(AVG(sp.amount), 2) as monto_promedio
FROM subscription_payments sp
GROUP BY sp.status
ORDER BY cantidad DESC;

-- 6️⃣ TIENDAS SIN SUSCRIPCIÓN
-- ============================================================================
SELECT 
  '👻 TIENDAS SIN SUSCRIPCIÓN' as seccion,
  '' as separador;

SELECT 
  st.id,
  st.name,
  st.slug,
  st.created_at,
  EXTRACT(DAY FROM NOW() - st.created_at)::INTEGER as dias_sin_suscribirse
FROM stores st
LEFT JOIN subscriptions s ON s.store_id = st.id
WHERE s.id IS NULL
ORDER BY st.created_at DESC
LIMIT 10;

-- ============================================================================
-- FIN DEL DIAGNÓSTICO
-- ============================================================================
SELECT 
  '✅ Diagnóstico completado' as resultado,
  NOW() as fecha_consulta;
