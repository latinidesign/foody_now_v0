-- ============================================================================
-- VERIFICACIÓN Y DIAGNÓSTICO DEL SISTEMA DE SUSCRIPCIONES
-- ============================================================================
-- Este script verifica que el sistema de suscripciones esté funcionando correctamente
-- ============================================================================

-- Verificar que todas las tablas existen
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'subscription_plans', 
      'subscriptions', 
      'subscription_payments', 
      'subscription_usage'
    ) THEN '✅ Existe'
    ELSE '❌ Falta'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%subscription%'
ORDER BY table_name;

-- Verificar que los tipos ENUM existen
SELECT 
  enumtypid::regtype as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as values
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname LIKE '%subscription%'
GROUP BY enumtypid
ORDER BY enum_name;

-- Verificar planes de suscripción
SELECT 
  'Planes de suscripción' as categoria,
  COUNT(*) as cantidad,
  string_agg(display_name, ', ') as planes
FROM subscription_plans
WHERE is_active = true;

-- Verificar suscripciones activas
SELECT 
  status,
  COUNT(*) as cantidad_tiendas,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as porcentaje
FROM subscriptions
GROUP BY status
ORDER BY cantidad_tiendas DESC;

-- Verificar tiendas con y sin suscripciones
SELECT 
  CASE 
    WHEN subscription_id IS NOT NULL THEN 'Con suscripción'
    ELSE 'Sin suscripción'
  END as estado,
  COUNT(*) as cantidad_tiendas
FROM stores
GROUP BY (subscription_id IS NOT NULL);

-- Verificar integridad referencial
SELECT 
  'Suscripciones huérfanas (sin tienda)' as problema,
  COUNT(*) as cantidad
FROM subscriptions s
LEFT JOIN stores st ON s.store_id = st.id
WHERE st.id IS NULL

UNION ALL

SELECT 
  'Tiendas con suscripción inválida' as problema,
  COUNT(*) as cantidad
FROM stores st
LEFT JOIN subscriptions s ON st.subscription_id = s.id
WHERE st.subscription_id IS NOT NULL AND s.id IS NULL

UNION ALL

SELECT 
  'Estado inconsistente store vs subscription' as problema,
  COUNT(*) as cantidad
FROM stores st
JOIN subscriptions s ON st.subscription_id = s.id
WHERE st.subscription_status != s.status;

-- Verificar fechas de expiración próximas
SELECT 
  st.name as tienda,
  s.status,
  CASE 
    WHEN s.status = 'trial' THEN s.trial_ends_at
    WHEN s.status = 'active' THEN s.paid_ends_at
    ELSE NULL
  END as fecha_expiracion,
  CASE 
    WHEN s.status = 'trial' THEN EXTRACT(DAY FROM s.trial_ends_at - NOW())
    WHEN s.status = 'active' THEN EXTRACT(DAY FROM s.paid_ends_at - NOW())
    ELSE NULL
  END as dias_restantes
FROM stores st
JOIN subscriptions s ON st.subscription_id = s.id
WHERE (
  (s.status = 'trial' AND s.trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '7 days') OR
  (s.status = 'active' AND s.paid_ends_at BETWEEN NOW() AND NOW() + INTERVAL '7 days')
)
ORDER BY fecha_expiracion;

-- Resumen general del sistema
SELECT 
  'RESUMEN DEL SISTEMA DE SUSCRIPCIONES' as titulo,
  (SELECT COUNT(*) FROM subscription_plans WHERE is_active = true) as planes_activos,
  (SELECT COUNT(*) FROM stores) as total_tiendas,
  (SELECT COUNT(*) FROM subscriptions) as total_suscripciones,
  (SELECT COUNT(*) FROM subscription_payments) as total_pagos,
  ROUND(
    (SELECT COUNT(*) FROM subscriptions WHERE status IN ('trial', 'active')) * 100.0 / 
    NULLIF((SELECT COUNT(*) FROM stores), 0), 
    2
  ) as porcentaje_activas;

-- Funciones disponibles
SELECT 
  routine_name as funcion,
  routine_type as tipo,
  CASE 
    WHEN routine_name LIKE '%subscription%' THEN '✅ Relacionada con suscripciones'
    ELSE 'ℹ️  Otra función'
  END as relevancia
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%subscription%'
ORDER BY routine_name;

-- Estado de triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  'Activo' as estado
FROM information_schema.triggers
WHERE event_object_table LIKE '%subscription%'
   OR trigger_name LIKE '%subscription%'
ORDER BY event_object_table, trigger_name;

SELECT 'Diagnóstico del sistema de suscripciones completado' AS resultado;
