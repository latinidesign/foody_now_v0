-- 📊 REPORTE COMPLETO DE ESTADOS DE SUSCRIPCIÓN - VERSIÓN FINAL
-- Ejecutar en el Editor SQL de Supabase

-- 1. RESUMEN GENERAL
SELECT 
  '🏪 RESUMEN GENERAL' as categoria,
  COUNT(*) as total_tiendas,
  COUNT(CASE WHEN is_active THEN 1 END) as tiendas_activas,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as con_email,
  COUNT(CASE WHEN subscription_status IS NOT NULL THEN 1 END) as con_suscripcion
FROM stores;

-- 2. ESTADÍSTICAS POR ESTADO DE SUSCRIPCIÓN
SELECT 
  '📊 ESTADOS DE SUSCRIPCIÓN' as categoria,
  CASE 
    WHEN subscription_status IS NULL THEN 'SIN_SUSCRIPCION'
    ELSE subscription_status::text
  END as estado,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM stores), 1) || '%' as porcentaje
FROM stores
GROUP BY subscription_status
ORDER BY cantidad DESC;

-- 3. DETALLE COMPLETO DE TODAS LAS TIENDAS
SELECT 
  '📋 DETALLE DE TIENDAS' as seccion,
  name as tienda,
  CASE 
    WHEN email IS NULL OR email = '' THEN '❌ Sin email'
    ELSE email
  END as email,
  CASE 
    WHEN subscription_status IS NULL THEN '✅ Sin suscripción'
    WHEN subscription_status = 'trial' THEN '🆓 Trial'
    WHEN subscription_status = 'active' THEN '💚 Activa'
    WHEN subscription_status = 'expired' THEN '❌ Expirada'
    WHEN subscription_status = 'cancelled' THEN '🚫 Cancelada'
    WHEN subscription_status = 'suspended' THEN '⏸️ Suspendida'
    ELSE '❓ ' || subscription_status::text
  END as estado_suscripcion,
  CASE 
    WHEN subscription_expires_at IS NULL THEN 'Sin fecha'
    WHEN subscription_expires_at < NOW() THEN '🔴 EXPIRADO: ' || subscription_expires_at::date
    ELSE '🟢 Expira: ' || subscription_expires_at::date
  END as expiracion,
  CASE 
    WHEN is_active THEN '✅ Activa'
    ELSE '❌ Inactiva'
  END as tienda_activa,
  created_at::date as fecha_creacion
FROM stores
ORDER BY 
  CASE 
    WHEN subscription_status = 'active' THEN 1
    WHEN subscription_status = 'trial' THEN 2
    WHEN subscription_status = 'expired' THEN 3
    WHEN subscription_status = 'suspended' THEN 4
    WHEN subscription_status = 'cancelled' THEN 5
    ELSE 6
  END,
  name;

-- 4. TIENDAS ESPECÍFICAS DEL PROBLEMA REPORTADO
SELECT 
  '🎯 TIENDAS ESPECÍFICAS' as categoria,
  name as tienda,
  email,
  id,
  subscription_status,
  subscription_expires_at,
  CASE 
    WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at < NOW() THEN 'EXPIRADA'
    WHEN subscription_status = 'trial' THEN 'EN_TRIAL'
    WHEN subscription_status IS NULL THEN 'SIN_SUSCRIPCION'
    ELSE 'OTROS'
  END as diagnostico,
  CASE 
    WHEN name ILIKE '%don mario%' THEN '🍕 PIZZERÍA DON MARIO - Problema reportado: Estado expirado, modal se cierra'
    WHEN name ILIKE '%lomos%' THEN '🥪 LOMOS NOW - Posible FoodyNow: Trial sin pago, modal se cierra'
    WHEN name ILIKE '%foody%' THEN '🏪 CUENTA FOODYNOW'
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

-- 5. PROBLEMAS DETECTADOS AUTOMÁTICAMENTE
SELECT 
  '🚨 PROBLEMAS DETECTADOS' as categoria,
  name as tienda,
  email,
  subscription_status,
  subscription_expires_at,
  CASE 
    WHEN subscription_status = 'trial' AND subscription_expires_at < NOW() THEN 'CRÍTICO: Trial expirado - Bloquea modal de suscripción'
    WHEN subscription_status = 'trial' AND (email IS NULL OR email = '') THEN 'PROBLEMA: Trial sin email - Posible configuración incorrecta'
    WHEN subscription_status = 'expired' THEN 'ATENCIÓN: Suscripción expirada - Necesita renovación'
    WHEN subscription_status = 'cancelled' THEN 'INFO: Suscripción cancelada'
    WHEN subscription_status IS NULL AND subscription_expires_at IS NOT NULL THEN 'INCONSISTENCIA: Sin estado pero con fecha de expiración'
    WHEN NOT is_active THEN 'PROBLEMA: Tienda inactiva'
    WHEN email IS NULL OR email = '' THEN 'CONFIGURACIÓN: Sin email'
    ELSE 'OK: Sin problemas detectados'
  END as problema_detectado,
  CASE 
    WHEN name ILIKE '%don mario%' OR name ILIKE '%lomos%' THEN '🎯 ALTA - Reportado por usuario'
    WHEN subscription_status = 'trial' AND subscription_expires_at < NOW() THEN '🔥 ALTA - Bloquea funcionalidad'
    WHEN subscription_status = 'expired' THEN '⚠️ MEDIA - Necesita atención'
    ELSE '📋 BAJA - Revisión rutinaria'
  END as prioridad
FROM stores
WHERE 
  -- Trial expirado (crítico)
  (subscription_status = 'trial' AND subscription_expires_at < NOW()) OR
  -- Trial sin email (problema)
  (subscription_status = 'trial' AND (email IS NULL OR email = '')) OR
  -- Estados problemáticos
  subscription_status IN ('expired', 'cancelled') OR
  -- Inconsistencias
  (subscription_status IS NULL AND subscription_expires_at IS NOT NULL) OR
  -- Tiendas específicas del reporte
  name ILIKE '%don mario%' OR
  name ILIKE '%lomos%' OR
  -- Tiendas inactivas
  NOT is_active OR
  -- Sin email
  (email IS NULL OR email = '')
ORDER BY 
  CASE 
    WHEN name ILIKE '%don mario%' OR name ILIKE '%lomos%' THEN 1
    WHEN subscription_status = 'trial' AND subscription_expires_at < NOW() THEN 2
    WHEN subscription_status = 'expired' THEN 3
    ELSE 4
  END,
  name;

-- 6. SUSCRIPCIONES POR EXPIRAR (PRÓXIMOS 30 DÍAS)
SELECT 
  '⏰ PRÓXIMAS EXPIRACIONES' as categoria,
  name as tienda,
  subscription_status,
  subscription_expires_at,
  EXTRACT(DAY FROM (subscription_expires_at - NOW())) as dias_restantes,
  CASE 
    WHEN EXTRACT(DAY FROM (subscription_expires_at - NOW())) <= 7 THEN '🔴 URGENTE - Menos de 7 días'
    WHEN EXTRACT(DAY FROM (subscription_expires_at - NOW())) <= 15 THEN '🟡 PRONTO - Menos de 15 días'
    ELSE '🟢 NORMAL - Más de 15 días'
  END as urgencia
FROM stores
WHERE 
  subscription_expires_at IS NOT NULL 
  AND subscription_expires_at > NOW() 
  AND subscription_expires_at <= NOW() + INTERVAL '30 days'
ORDER BY subscription_expires_at ASC;
