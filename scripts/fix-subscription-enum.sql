-- ============================================================================
-- SCRIPT: Agregar estados faltantes al enum subscription_status
-- ============================================================================
-- 
-- PROBLEMA: El enum subscription_status no incluye 'pending' ni 'past_due'
-- SOLUCIÓN: Agregar estos valores al enum existente
--
-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- ============================================================================

-- Paso 1: Verificar estado actual del enum
SELECT 
  enumlabel as estado_actual
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
ORDER BY enumsortorder;

-- Paso 2: Agregar 'pending' al enum (si no existe)
DO $$ 
BEGIN
    ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pending';
    RAISE NOTICE '✅ Valor pending agregado al enum subscription_status';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'ℹ️ Valor pending ya existe en el enum';
END $$;

-- Paso 3: Agregar 'past_due' al enum (si no existe)
DO $$ 
BEGIN
    ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'past_due';
    RAISE NOTICE '✅ Valor past_due agregado al enum subscription_status';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'ℹ️ Valor past_due ya existe en el enum';
END $$;

-- Paso 3b: Agregar 'post_due' al enum (si no existe)
DO $$ 
BEGIN
    ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'post_due';
    RAISE NOTICE '✅ Valor post_due agregado al enum subscription_status';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'ℹ️ Valor post_due ya existe en el enum';
END $$;

-- Paso 4: Verificar que los valores fueron agregados
SELECT 
  enumlabel as estado_disponible,
  CASE enumlabel
    WHEN 'pending' THEN '⏳ Pendiente de pago'
    WHEN 'trial' THEN '🆓 Período de prueba'
    WHEN 'active' THEN '✅ Activo con pago al día'
    WHEN 'past_due' THEN '⚠️ Suspendido por falta de pago'
    WHEN 'suspended' THEN '⏸️ Pausado'
    WHEN 'cancelled' THEN '❌ Cancelado'
    WHEN 'expired' THEN '💀 Expirado'
  END as descripcion
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subscription_status')
ORDER BY enumsortorder;

-- ============================================================================
-- PASO 5: Corregir tiendas con estados incorrectos
-- ============================================================================

-- Primero, ver cuántas tiendas tienen trial expirado (candidatas a corrección)
SELECT 
  id,
  name,
  email,
  subscription_status,
  subscription_expires_at,
  CASE 
    WHEN subscription_status = 'trial' AND subscription_expires_at < NOW() 
    THEN '❌ Trial expirado - debería ser expired o pending'
    WHEN subscription_status = 'trial' AND subscription_expires_at >= NOW()
    THEN '✅ Trial válido'
    ELSE '❓ Revisar manualmente'
  END as diagnostico
FROM stores
WHERE subscription_status IS NOT NULL
ORDER BY 
  CASE WHEN subscription_status = 'trial' AND subscription_expires_at < NOW() THEN 0 ELSE 1 END,
  created_at DESC;

-- ============================================================================
-- PASO 6: Aplicar correcciones (DESCOMENTA PARA EJECUTAR)
-- ============================================================================

-- Opción A: Cambiar trial expirado a 'expired'
/*
UPDATE stores
SET 
  subscription_status = 'expired',
  updated_at = NOW()
WHERE subscription_status = 'trial'
  AND subscription_expires_at < NOW();
*/

-- Opción B: Cambiar trial expirado a 'pending' (si queremos que vuelvan a suscribirse)
/*
UPDATE stores
SET 
  subscription_status = 'pending',
  updated_at = NOW()
WHERE subscription_status = 'trial'
  AND subscription_expires_at < NOW();
*/

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

SELECT 
  subscription_status,
  COUNT(*) as cantidad,
  STRING_AGG(name, ', ' ORDER BY created_at DESC) as tiendas
FROM stores
WHERE subscription_status IS NOT NULL
GROUP BY subscription_status
ORDER BY cantidad DESC;
