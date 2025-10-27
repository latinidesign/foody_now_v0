-- Script para verificar si las tablas de notificaciones están creadas
-- Ejecutar en Supabase SQL Editor para verificar el estado de la base de datos

-- 1. Verificar existencia de tablas
SELECT 
  tablename,
  schemaname
FROM pg_tables 
WHERE tablename IN ('push_subscriptions', 'whatsapp_message_queue', 'whatsapp_webhook_events')
ORDER BY tablename;

-- 2. Verificar columnas agregadas a orders
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('store_notified_at', 'customer_notified_at', 'notification_status')
ORDER BY column_name;

-- 3. Verificar campos de WhatsApp en store_settings
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'store_settings' 
AND column_name LIKE '%wa_%'
ORDER BY column_name;

-- 4. Verificar si existen políticas RLS para las nuevas tablas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('push_subscriptions', 'whatsapp_message_queue')
ORDER BY tablename, policyname;

-- 5. Verificar índices en las nuevas tablas
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('push_subscriptions', 'whatsapp_message_queue')
ORDER BY tablename, indexname;

-- 6. Verificar triggers
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('push_subscriptions', 'whatsapp_message_queue')
ORDER BY event_object_table, trigger_name;
