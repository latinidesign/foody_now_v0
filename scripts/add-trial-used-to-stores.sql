-- ============================================================================
-- MIGRACIÓN: Agregar control de trial por comercio
-- ============================================================================
-- 
-- OBJETIVO: Evitar que un comercio abuse del período de prueba gratuito
--           creando múltiples suscripciones
--
-- ESTRATEGIA: Marcar trial_used = true cuando la suscripción pasa a authorized
--             por primera vez, independientemente de si luego cancela
--
-- EJECUTAR EN: Supabase SQL Editor
-- ============================================================================

-- Paso 1: Agregar campos para control de trial
ALTER TABLE stores 
  ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_used_at TIMESTAMP NULL;

-- Paso 2: Crear índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_stores_trial_used 
  ON stores(trial_used) 
  WHERE trial_used = false;

-- Paso 3: Marcar como trial_used las tiendas que ya tienen suscripciones
--         (esto es para migrar datos existentes)
UPDATE stores 
SET 
  trial_used = true,
  trial_used_at = (
    SELECT MIN(created_at) 
    FROM subscriptions 
    WHERE subscriptions.store_id = stores.id
  )
WHERE id IN (
  SELECT DISTINCT store_id 
  FROM subscriptions 
  WHERE status IN ('trial', 'active', 'cancelled', 'expired')
);

-- Paso 4: Agregar comentarios para documentación
COMMENT ON COLUMN stores.trial_used IS 
  'Indica si el comercio ya utilizó su período de prueba gratuito (una sola vez). Se marca true cuando la primera suscripción pasa a authorized.';

COMMENT ON COLUMN stores.trial_used_at IS 
  'Fecha en que se marcó trial_used = true (primera autorización de suscripción en MercadoPago)';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Mostrar tiendas que ya usaron trial
SELECT 
  id,
  name,
  slug,
  trial_used,
  trial_used_at,
  created_at
FROM stores
WHERE trial_used = true
ORDER BY trial_used_at DESC
LIMIT 10;

-- Mostrar tiendas que AÚN NO usaron trial
SELECT 
  id,
  name,
  slug,
  trial_used,
  created_at
FROM stores
WHERE trial_used = false
ORDER BY created_at DESC
LIMIT 10;

-- Estadísticas
SELECT 
  trial_used,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as porcentaje
FROM stores
GROUP BY trial_used;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- 
-- ✅ Campo trial_used agregado a tabla stores
-- ✅ Tiendas con suscripciones existentes marcadas como trial_used = true
-- ✅ Tiendas nuevas sin suscripción quedan como trial_used = false
-- ✅ Índice creado para consultas rápidas
--
-- PRÓXIMO PASO:
-- Modificar /api/subscription/create para elegir plan según trial_used
-- Modificar /api/webhooks/mercadopago para marcar trial_used en authorized
-- ============================================================================

SELECT '✅ Migración completada: Control de trial por comercio agregado' AS resultado;
