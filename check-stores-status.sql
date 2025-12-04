-- 📊 REPORTE COMPLETO DE ESTADOS DE SUSCRIPCIÓN DE TIENDAS
-- Ejecutar en el Editor SQL de Supabase para ver todos los estados

-- Vista general de todas las tiendas con información de suscripción
SELECT 
  '🏪 RESUMEN GENERAL' as seccion,
  '' as tienda,
  '' as email,
  '' as estado,
  '' as expira,
  '' as activa,
  COUNT(*) as total_tiendas
FROM stores
WHERE TRUE

UNION ALL

SELECT 
  '=' as seccion,
  '==================================' as tienda,
  '============================' as email,
  '=========' as estado,
  '===================' as expira,
  '======' as activa,
  0 as total_tiendas

UNION ALL

-- Detalle de cada tienda
SELECT 
  CASE 
    WHEN subscription_status IS NULL THEN '✅ Sin Suscripción'
    WHEN subscription_status = 'trial' THEN '🆓 Trial'
    WHEN subscription_status = 'active' THEN '💚 Activa'
    WHEN subscription_status = 'expired' THEN '❌ Expirada'
    WHEN subscription_status = 'cancelled' THEN '🚫 Cancelada'
    WHEN subscription_status = 'suspended' THEN '⏸️ Suspendida'
    ELSE '❓ ' || subscription_status
  END as seccion,
  
  name as tienda,
  
  COALESCE(email, 'Sin email') as email,
  
  CASE 
    WHEN subscription_status IS NULL THEN 'NULL'
    ELSE subscription_status::text
  END as estado,
  
  CASE 
    WHEN subscription_expires_at IS NULL THEN 'Sin fecha'
    WHEN subscription_expires_at < NOW() THEN '🔴 ' || subscription_expires_at::text
    ELSE '🟢 ' || subscription_expires_at::text
  END as expira,
  
  CASE 
    WHEN is_active THEN '✅'
    ELSE '❌'
  END as activa,
  
  0 as total_tiendas

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

-- Estadísticas por estado
SELECT 
  '📈 ESTADÍSTICAS' as titulo,
  CASE 
    WHEN subscription_status IS NULL THEN 'NULL'
    ELSE subscription_status::text
  END as estado,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM stores), 1) || '%' as porcentaje
FROM stores
GROUP BY subscription_status
ORDER BY cantidad DESC;

-- Tiendas con problemas específicos
SELECT 
  '⚠️ TIENDAS PROBLEMÁTICAS' as categoria,
  name as tienda,
  email,
  subscription_status as estado,
  CASE 
    WHEN subscription_status = 'trial' AND subscription_expires_at < NOW() THEN 'Trial expirado - Bloquea modal'
    WHEN subscription_status = 'trial' AND email IS NULL THEN 'Trial sin email - Posible problema'
    WHEN subscription_status IS NULL AND subscription_expires_at IS NOT NULL THEN 'Estado NULL con fecha - Inconsistente'
    WHEN subscription_status = 'active' AND subscription_expires_at < NOW() THEN 'Activa pero expirada - Error'
    ELSE 'OK'
  END as problema
FROM stores
WHERE 
  -- Trial expirado
  (subscription_status = 'trial' AND subscription_expires_at < NOW()) OR
  -- Trial sin email
  (subscription_status = 'trial' AND email IS NULL) OR
  -- Estado inconsistente
  (subscription_status IS NULL AND subscription_expires_at IS NOT NULL) OR
  -- Activa pero expirada
  (subscription_status = 'active' AND subscription_expires_at < NOW())
ORDER BY name;

-- Tiendas específicas mencionadas en el problema
SELECT 
  '🎯 TIENDAS ESPECÍFICAS DEL REPORTE' as categoria,
  name as tienda,
  email,
  id,
  subscription_status as estado,
  subscription_expires_at as expira,
  CASE 
    WHEN name ILIKE '%don mario%' THEN 'Pizzería problema: ' || CASE WHEN subscription_status IS NULL THEN 'NULL' ELSE subscription_status::text END
    WHEN name ILIKE '%lomos%' OR name ILIKE '%foody%' THEN 'Posible FoodyNow: ' || CASE WHEN subscription_status IS NULL THEN 'NULL' ELSE subscription_status::text END
    ELSE 'Otra tienda'
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

-- Suscripciones activas en user_subscriptions
SELECT 
  '💳 SUSCRIPCIONES MERCADOPAGO' as categoria,
  s.name as tienda,
  us.status as estado_mp,
  us.mercado_pago_subscription_id as mp_id,
  us.created_at as creada,
  us.updated_at as actualizada,
  CASE 
    WHEN s.subscription_status IS DISTINCT FROM us.status THEN '⚠️ Estados diferentes'
    ELSE '✅ Consistente'
  END as consistencia
FROM user_subscriptions us
JOIN stores s ON us.store_id = s.id
WHERE us.status != 'cancelled'
ORDER BY us.updated_at DESC
LIMIT 10;
