-- ===================================================================
-- SCRIPT PARA LIMPIAR CAMPOS DE CREDENCIALES POR TENANT
-- Ejecutar después de implementar las variables de entorno globales
-- ===================================================================

-- Verificar qué tiendas tienen credenciales configuradas antes de limpiar
SELECT 'CREDENCIALES EXISTENTES ANTES DE LIMPIAR:' as status;

SELECT 
  s.name as tienda,
  CASE WHEN ss.wa_phone_number_id IS NOT NULL THEN '✅ Configurado' ELSE '❌ No configurado' END as phone_id,
  CASE WHEN ss.wa_access_token IS NOT NULL THEN '✅ Configurado' ELSE '❌ No configurado' END as access_token,
  CASE WHEN ss.wa_business_account_id IS NOT NULL THEN '✅ Configurado' ELSE '❌ No configurado' END as business_id
FROM stores s
LEFT JOIN store_settings ss ON s.id = ss.store_id
ORDER BY s.name;

-- Limpiar los campos de credenciales por tenant (ya no se usan)
UPDATE store_settings 
SET 
  wa_phone_number_id = NULL,
  wa_access_token = NULL,
  wa_business_account_id = NULL,
  wa_api_version = NULL,
  updated_at = NOW()
WHERE 
  wa_phone_number_id IS NOT NULL 
  OR wa_access_token IS NOT NULL 
  OR wa_business_account_id IS NOT NULL 
  OR wa_api_version IS NOT NULL;

-- Mostrar el resultado
SELECT 'CREDENCIALES LIMPIADAS:' as status;

SELECT 
  s.name as tienda,
  CASE WHEN ss.wa_phone_number_id IS NOT NULL THEN '⚠️ Aún existe' ELSE '✅ Limpiado' END as phone_id,
  CASE WHEN ss.wa_access_token IS NOT NULL THEN '⚠️ Aún existe' ELSE '✅ Limpiado' END as access_token,
  CASE WHEN ss.wa_business_account_id IS NOT NULL THEN '⚠️ Aún existe' ELSE '✅ Limpiado' END as business_id
FROM stores s
LEFT JOIN store_settings ss ON s.id = ss.store_id
ORDER BY s.name;

-- Opcional: Eliminar las columnas completamente si estás seguro
-- ADVERTENCIA: Esto eliminará permanentemente las columnas y sus datos
-- Descomenta solo si estás completamente seguro:

/*
ALTER TABLE store_settings DROP COLUMN IF EXISTS wa_phone_number_id;
ALTER TABLE store_settings DROP COLUMN IF EXISTS wa_access_token;
ALTER TABLE store_settings DROP COLUMN IF EXISTS wa_business_account_id;
ALTER TABLE store_settings DROP COLUMN IF EXISTS wa_api_version;

SELECT 'COLUMNAS DE CREDENCIALES ELIMINADAS PERMANENTEMENTE' as status;
*/

SELECT '✅ LIMPIEZA DE CREDENCIALES COMPLETADA' as resultado;
SELECT 'Ahora configura las variables de entorno globales en Vercel/Deploy' as next_step;
