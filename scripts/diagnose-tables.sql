-- ===================================================================
-- SCRIPT DE DIAGNÓSTICO DE TABLAS
-- Ejecutar ANTES de setup-complete-notifications.sql para verificar el estado actual
-- ===================================================================

-- Verificar si las tablas principales existen
SELECT 'VERIFICANDO EXISTENCIA DE TABLAS:' as status;

SELECT 
  tablename as tabla_encontrada,
  schemaname as esquema
FROM pg_tables 
WHERE tablename IN ('stores', 'orders', 'store_settings', 'products', 'order_items')
  AND schemaname = 'public'
ORDER BY tablename;

-- Verificar estructura de la tabla orders si existe
SELECT 'ESTRUCTURA DE LA TABLA ORDERS:' as status;

SELECT 
  column_name as columna,
  data_type as tipo_dato,
  is_nullable as permite_null,
  column_default as valor_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints y foreign keys de orders
SELECT 'FOREIGN KEYS EN ORDERS:' as status;

SELECT
  tc.constraint_name as nombre_constraint,
  tc.table_name as tabla,
  kcu.column_name as columna,
  ccu.table_name as tabla_referenciada,
  ccu.column_name as columna_referenciada
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'orders'
  AND tc.table_schema = 'public';

-- Verificar si ya existen las tablas de notificaciones
SELECT 'TABLAS DE NOTIFICACIONES EXISTENTES:' as status;

SELECT 
  tablename as tabla_notificacion,
  schemaname as esquema
FROM pg_tables 
WHERE tablename IN ('push_subscriptions', 'whatsapp_message_queue', 'whatsapp_webhook_events')
  AND schemaname = 'public'
ORDER BY tablename;

-- Verificar campos de notificación en orders si existen
SELECT 'CAMPOS DE NOTIFICACIÓN EN ORDERS:' as status;

SELECT 
  column_name as campo_notificacion,
  data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND column_name IN ('store_notified_at', 'customer_notified_at', 'notification_status')
ORDER BY column_name;

-- Verificar campos de WhatsApp en store_settings
SELECT 'CAMPOS DE WHATSAPP EN STORE_SETTINGS:' as status;

SELECT 
  column_name as campo_whatsapp,
  data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'store_settings' 
  AND table_schema = 'public'
  AND column_name LIKE '%wa_%'
ORDER BY column_name;

SELECT '✅ DIAGNÓSTICO COMPLETADO' as resultado;
