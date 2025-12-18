-- ============================================================================
-- SCRIPT DE DIAGNÓSTICO: Estado actual del sistema de suscripciones
-- ============================================================================
-- 
-- Ejecutar DESPUÉS de aplicar la migración add-trial-used-to-stores.sql
-- para verificar que todo esté correcto
--
-- ============================================================================

-- 1. Verificar que las columnas trial_used existan
SELECT 
  'Columnas trial_used' as verificacion,
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'stores' 
  AND column_name IN ('trial_used', 'trial_used_at');

-- 2. Verificar índice creado
SELECT 
  'Índice trial_used' as verificacion,
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'stores' 
  AND indexname = 'idx_stores_trial_used';

-- 3. Resumen de tiendas por estado de trial_used
SELECT 
  'Resumen trial_used' as reporte,
  trial_used,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM stores
GROUP BY trial_used
ORDER BY trial_used DESC;

-- 4. Tiendas con trial_used = true (tienen historial)
SELECT 
  'Tiendas con trial usado' as reporte,
  s.id,
  s.name,
  s.trial_used,
  s.trial_used_at,
  COUNT(sub.id) as num_suscripciones
FROM stores s
LEFT JOIN subscriptions sub ON sub.store_id = s.id
WHERE s.trial_used = true
GROUP BY s.id, s.name, s.trial_used, s.trial_used_at
ORDER BY s.trial_used_at DESC NULLS LAST;

-- 5. Tiendas con trial_used = false (nuevas o sin historial)
SELECT 
  'Tiendas SIN trial usado' as reporte,
  s.id,
  s.name,
  s.trial_used,
  s.created_at,
  COUNT(sub.id) as num_suscripciones
FROM stores s
LEFT JOIN subscriptions sub ON sub.store_id = s.id
WHERE s.trial_used = false
GROUP BY s.id, s.name, s.trial_used, s.created_at
ORDER BY s.created_at DESC;

-- 6. Estados de suscripciones actuales
SELECT 
  'Estados de suscripciones' as reporte,
  status,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM subscriptions
GROUP BY status
ORDER BY cantidad DESC;

-- 7. Tiendas que PUEDEN renovar (expired, cancelled, suspended, past_due)
SELECT 
  'Tiendas que pueden renovar' as reporte,
  s.id as store_id,
  s.name as store_name,
  s.trial_used,
  sub.status as subscription_status,
  sub.trial_ends_at,
  sub.updated_at as last_update
FROM stores s
JOIN subscriptions sub ON sub.store_id = s.id
WHERE sub.status IN ('expired', 'cancelled', 'suspended', 'past_due')
ORDER BY sub.updated_at DESC;

-- 8. Verificar consistencia: tiendas sin trial_used pero con suscripciones
-- (posibles casos que necesitan corrección)
SELECT 
  '⚠️ INCONSISTENCIAS' as alerta,
  s.id,
  s.name,
  s.trial_used,
  s.trial_used_at,
  ARRAY_AGG(sub.status ORDER BY sub.created_at) as estados_historicos,
  MIN(sub.created_at) as primera_suscripcion,
  MAX(sub.created_at) as ultima_suscripcion
FROM stores s
JOIN subscriptions sub ON sub.store_id = s.id
WHERE s.trial_used = false  -- Dice que NO usó trial
  AND sub.status IN ('trial', 'active', 'expired', 'cancelled', 'suspended', 'past_due')  -- Pero SÍ tiene historial
GROUP BY s.id, s.name, s.trial_used, s.trial_used_at;

-- 9. Resumen ejecutivo
SELECT 
  'RESUMEN EJECUTIVO' as reporte,
  (SELECT COUNT(*) FROM stores) as total_tiendas,
  (SELECT COUNT(*) FROM stores WHERE trial_used = true) as tiendas_con_trial_usado,
  (SELECT COUNT(*) FROM stores WHERE trial_used = false) as tiendas_nuevas,
  (SELECT COUNT(*) FROM subscriptions) as total_suscripciones,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as suscripciones_activas,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'trial') as suscripciones_en_trial,
  (SELECT COUNT(*) FROM subscriptions WHERE status IN ('expired', 'cancelled', 'suspended', 'past_due')) as suscripciones_renovables;

-- 10. Plan de acción recomendado según datos
SELECT 
  'PLAN DE ACCIÓN' as recomendacion,
  CASE 
    WHEN (SELECT COUNT(*) FROM stores WHERE trial_used = false) > 0 
    THEN 'Tienes ' || (SELECT COUNT(*) FROM stores WHERE trial_used = false) || ' tiendas que pueden usar trial'
    ELSE 'Todas las tiendas ya usaron su trial'
  END as tiendas_nuevas,
  CASE 
    WHEN (SELECT COUNT(*) FROM subscriptions WHERE status IN ('expired', 'cancelled', 'suspended', 'past_due')) > 0
    THEN 'Tienes ' || (SELECT COUNT(*) FROM subscriptions WHERE status IN ('expired', 'cancelled', 'suspended', 'past_due')) || ' suscripciones que pueden renovar SIN trial'
    ELSE 'No hay suscripciones para renovar'
  END as renovaciones_pendientes;

-- ============================================================================
-- FIN DEL DIAGNÓSTICO
-- ============================================================================
