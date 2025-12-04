-- 📊 REPORTE COMPLETO DE ESTADOS DE TIENDAS - VERSIÓN CORREGIDA
-- Ejecutar en el Editor SQL de Supabase

-- 1. RESUMEN GENERAL DE TIENDAS
SELECT 
  '🏪 TIENDAS REGISTRADAS' as categoria,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as activas,
  COUNT(CASE WHEN NOT is_active THEN 1 END) as inactivas,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as con_email
FROM stores;

-- 2. DETALLE DE TODAS LAS TIENDAS
SELECT 
  '📋 DETALLE DE TIENDAS' as seccion,
  name as tienda,
  CASE 
    WHEN email IS NULL OR email = '' THEN '❌ Sin email'
    ELSE email
  END as email,
  CASE 
    WHEN is_active THEN '✅ Activa'
    ELSE '❌ Inactiva'
  END as estado,
  created_at::date as fecha_creacion,
  updated_at::date as ultima_actualizacion
FROM stores
ORDER BY created_at DESC;

-- 3. TIENDAS ESPECÍFICAS MENCIONADAS
SELECT 
  '🎯 TIENDAS DEL REPORTE' as categoria,
  name as tienda,
  email,
  id,
  is_active,
  created_at,
  CASE 
    WHEN name ILIKE '%don mario%' THEN '🍕 Pizzería Don Mario - Problema reportado'
    WHEN name ILIKE '%lomos%' THEN '🥪 Lomos Now - Posible FoodyNow'
    WHEN name ILIKE '%foody%' THEN '🏪 Cuenta FoodyNow'
    ELSE '🔍 Otra tienda relacionada'
  END as observacion
FROM stores
WHERE 
  name ILIKE '%don mario%' OR 
  name ILIKE '%lomos%' OR 
  name ILIKE '%foody%' OR
  email ILIKE '%foodynow%'
ORDER BY 
  CASE 
    WHEN name ILIKE '%don mario%' THEN 1
    WHEN name ILIKE '%lomos%' THEN 2
    ELSE 3
  END;

-- 4. SUSCRIPCIONES ACTIVAS (si la tabla existe)
SELECT 
  '💳 SUSCRIPCIONES MERCADOPAGO' as categoria,
  s.name as tienda,
  s.email,
  us.status as estado_suscripcion,
  us.mercado_pago_subscription_id as mp_id,
  us.created_at as fecha_creacion_suscripcion,
  us.updated_at as ultima_actualizacion_suscripcion,
  CASE 
    WHEN us.status = 'active' THEN '✅ Activa'
    WHEN us.status = 'trial' THEN '🆓 Prueba'
    WHEN us.status = 'expired' THEN '❌ Expirada'
    WHEN us.status = 'cancelled' THEN '🚫 Cancelada'
    WHEN us.status = 'pending' THEN '⏳ Pendiente'
    ELSE '❓ ' || us.status
  END as estado_descripcion
FROM user_subscriptions us
JOIN stores s ON us.store_id = s.id
ORDER BY us.updated_at DESC;

-- 5. ESTADÍSTICAS DE SUSCRIPCIONES
SELECT 
  '📊 ESTADÍSTICAS SUSCRIPCIONES' as titulo,
  status as estado,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_subscriptions), 1) || '%' as porcentaje
FROM user_subscriptions
GROUP BY status
ORDER BY cantidad DESC;

-- 6. TIENDAS SIN SUSCRIPCIONES
SELECT 
  '⚠️ TIENDAS SIN SUSCRIPCIONES' as categoria,
  s.name as tienda,
  s.email,
  s.is_active,
  s.created_at
FROM stores s
LEFT JOIN user_subscriptions us ON s.id = us.store_id
WHERE us.store_id IS NULL
ORDER BY s.created_at DESC;

-- 7. PROBLEMAS DETECTADOS
SELECT 
  '🚨 PROBLEMAS DETECTADOS' as categoria,
  s.name as tienda,
  CASE 
    WHEN s.email IS NULL OR s.email = '' THEN 'Sin email configurado'
    WHEN NOT s.is_active THEN 'Tienda inactiva'
    WHEN us.status = 'expired' THEN 'Suscripción expirada'
    WHEN us.status = 'cancelled' THEN 'Suscripción cancelada'
    ELSE 'Sin problemas detectados'
  END as problema,
  CASE 
    WHEN s.name ILIKE '%don mario%' THEN '🎯 Tienda reportada por usuario'
    WHEN s.name ILIKE '%lomos%' THEN '🎯 Posible cuenta problema'
    ELSE '📋 Revisión general'
  END as prioridad
FROM stores s
LEFT JOIN user_subscriptions us ON s.id = us.store_id
WHERE 
  (s.email IS NULL OR s.email = '') OR
  NOT s.is_active OR
  us.status IN ('expired', 'cancelled') OR
  s.name ILIKE '%don mario%' OR
  s.name ILIKE '%lomos%'
ORDER BY 
  CASE 
    WHEN s.name ILIKE '%don mario%' THEN 1
    WHEN s.name ILIKE '%lomos%' THEN 2
    ELSE 3
  END;
