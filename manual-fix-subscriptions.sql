-- 🔧 CORRECCIÓN MANUAL DE ESTADOS DE SUSCRIPCIÓN
-- Ejecutar paso a paso en Supabase SQL Editor

-- ==========================================
-- PASO 1: VER ESTADO ACTUAL DE AMBAS TIENDAS
-- ==========================================
SELECT 
  'ESTADO ACTUAL' as paso,
  name as tienda,
  subscription_status,
  subscription_expires_at,
  subscription_id
FROM stores
WHERE 
  name ILIKE '%don mario%' OR 
  name ILIKE '%lomos%'
ORDER BY name;

-- ==========================================  
-- PASO 2: LIMPIAR COMPLETAMENTE PIZZERÍA DON MARIO
-- ==========================================
-- Esto permite suscribirse por primera vez (estado limpio)

UPDATE stores 
SET 
  subscription_status = NULL,
  subscription_expires_at = NULL,
  subscription_id = NULL
WHERE name ILIKE '%don mario%';

-- ==========================================
-- PASO 3: LIMPIAR COMPLETAMENTE LOMOS NOW  
-- ==========================================
-- Esto permite suscribirse por primera vez (estado limpio)

UPDATE stores 
SET 
  subscription_status = NULL,
  subscription_expires_at = NULL,
  subscription_id = NULL
WHERE name ILIKE '%lomos%';

-- ==========================================
-- PASO 4: VERIFICAR CORRECCIONES
-- ==========================================
SELECT 
  'DESPUÉS DE CORRECCIÓN' as paso,
  name as tienda,
  subscription_status,
  subscription_expires_at,
  subscription_id,
  CASE 
    WHEN subscription_status IS NULL AND subscription_expires_at IS NULL AND subscription_id IS NULL 
    THEN '✅ LIMPIO - Puede suscribirse por primera vez'
    ELSE '❌ NECESITA MÁS LIMPIEZA'
  END as estado_modal
FROM stores
WHERE 
  name ILIKE '%don mario%' OR 
  name ILIKE '%lomos%'
ORDER BY name;

-- ==========================================
-- ALTERNATIVA: SI PREFIERES ESTADO 'PENDING'
-- ==========================================
-- Descomenta las siguientes líneas si prefieres 'pending' en lugar de NULL

/*
-- Para Don Mario (estado pending)
UPDATE stores 
SET 
  subscription_status = 'pending',
  subscription_expires_at = NULL,
  subscription_id = NULL
WHERE name ILIKE '%don mario%';

-- Para Lomos Now (estado pending)  
UPDATE stores 
SET 
  subscription_status = 'pending',
  subscription_expires_at = NULL,
  subscription_id = NULL
WHERE name ILIKE '%lomos%';
*/
