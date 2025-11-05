-- ============================================================================
-- MIGRACIÓN: SUSCRIPCIONES PARA TIENDAS EXISTENTES
-- ============================================================================
-- Este script asigna suscripciones de prueba a todas las tiendas existentes
-- que no tienen suscripción asignada
-- ============================================================================

-- Función para crear suscripción de prueba para tienda existente
CREATE OR REPLACE FUNCTION create_trial_subscription_for_store(store_uuid UUID)
RETURNS UUID AS $$
DECLARE
  trial_plan_id UUID;
  new_subscription_id UUID;
BEGIN
  -- Obtener el ID del plan de prueba
  SELECT id INTO trial_plan_id 
  FROM subscription_plans 
  WHERE name = 'trial' AND is_trial = true
  LIMIT 1;
  
  IF trial_plan_id IS NULL THEN
    RAISE EXCEPTION 'Plan de prueba no encontrado. Ejecuta primero subscription-system.sql';
  END IF;
  
  -- Crear la suscripción de prueba
  INSERT INTO subscriptions (
    store_id,
    plan_id,
    status,
    trial_started_at,
    trial_ends_at,
    auto_renewal
  ) VALUES (
    store_uuid,
    trial_plan_id,
    'trial',
    NOW(),
    NOW() + INTERVAL '30 days',
    true
  ) RETURNING id INTO new_subscription_id;
  
  -- Actualizar la tienda con la referencia a la suscripción
  UPDATE stores SET 
    subscription_id = new_subscription_id,
    subscription_status = 'trial',
    subscription_expires_at = NOW() + INTERVAL '30 days'
  WHERE id = store_uuid;
  
  RETURN new_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- APLICAR SUSCRIPCIONES A TIENDAS EXISTENTES
-- ============================================================================
DO $$
DECLARE
  store_record RECORD;
  subscription_count INTEGER;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Verificar que existen los planes de suscripción
  SELECT COUNT(*) INTO subscription_count FROM subscription_plans;
  
  IF subscription_count = 0 THEN
    RAISE EXCEPTION 'No hay planes de suscripción. Ejecuta primero subscription-system.sql';
  END IF;
  
  RAISE NOTICE 'Iniciando migración de suscripciones...';
  RAISE NOTICE 'Planes disponibles: %', subscription_count;
  
  -- Procesar cada tienda que no tiene suscripción
  FOR store_record IN 
    SELECT id, name, slug 
    FROM stores 
    WHERE subscription_id IS NULL
    ORDER BY created_at
  LOOP
    BEGIN
      -- Crear suscripción de prueba para esta tienda
      PERFORM create_trial_subscription_for_store(store_record.id);
      
      success_count := success_count + 1;
      RAISE NOTICE 'Suscripción creada para tienda: % (ID: %)', 
        store_record.name, store_record.id;
        
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE NOTICE 'Error creando suscripción para tienda % (ID: %): %', 
        store_record.name, store_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Migración completada:';
  RAISE NOTICE '- Suscripciones creadas exitosamente: %', success_count;
  RAISE NOTICE '- Errores: %', error_count;
END $$;

-- ============================================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- ============================================================================
-- Mostrar resumen de suscripciones por estado
SELECT 
  s.status,
  COUNT(*) as cantidad_tiendas,
  ROUND(AVG(EXTRACT(DAY FROM s.trial_ends_at - NOW())), 1) as dias_promedio_restantes
FROM subscriptions s
GROUP BY s.status
ORDER BY s.status;

-- Mostrar tiendas con sus suscripciones
SELECT 
  st.name as tienda_nombre,
  st.slug as tienda_slug,
  s.status as suscripcion_estado,
  sp.display_name as plan_nombre,
  s.trial_started_at as inicio_prueba,
  s.trial_ends_at as fin_prueba,
  EXTRACT(DAY FROM s.trial_ends_at - NOW())::INTEGER as dias_restantes
FROM stores st
LEFT JOIN subscriptions s ON st.subscription_id = s.id
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
ORDER BY st.created_at;

-- Verificar integridad de datos
SELECT 
  'Tiendas sin suscripción' as categoria,
  COUNT(*) as cantidad
FROM stores 
WHERE subscription_id IS NULL

UNION ALL

SELECT 
  'Suscripciones sin tienda' as categoria,
  COUNT(*)
FROM subscriptions s
LEFT JOIN stores st ON s.store_id = st.id
WHERE st.id IS NULL

UNION ALL

SELECT 
  'Suscripciones activas' as categoria,
  COUNT(*)
FROM subscriptions 
WHERE status IN ('trial', 'active') 
  AND (trial_ends_at > NOW() OR paid_ends_at > NOW());

-- ============================================================================
-- LIMPIAR FUNCIÓN TEMPORAL
-- ============================================================================
-- Eliminar la función temporal después de la migración
DROP FUNCTION IF EXISTS create_trial_subscription_for_store(UUID);

-- ============================================================================
-- RESULTADO FINAL
-- ============================================================================
SELECT 'Migración de suscripciones completada exitosamente' AS resultado;
