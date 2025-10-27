-- ===================================================================
-- SCRIPT COMPLETO PARA ACTUALIZAR BASE DE DATOS CON SISTEMA DE NOTIFICACIONES
-- Ejecutar en Supabase SQL Editor para implementar todas las tablas y campos necesarios
-- ===================================================================

-- 1. TABLAS DE NOTIFICACIONES
-- ===================================================================

-- Tabla para almacenar suscripciones de push notifications de las tiendas
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Un store solo puede tener una suscripción activa
  UNIQUE(store_id)
);

-- RLS para push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Los stores pueden ver/editar solo sus propias suscripciones
DROP POLICY IF EXISTS "stores_own_push_subscriptions" ON push_subscriptions;
CREATE POLICY "stores_own_push_subscriptions" 
ON push_subscriptions 
FOR ALL 
USING (store_id = (current_setting('app.current_store_id', true))::UUID);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_store_id ON push_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- 2. CAMPOS DE NOTIFICACIÓN EN ORDERS
-- ===================================================================

-- Agregar columnas de control a la tabla orders para tracking de notificaciones
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_status JSONB DEFAULT '{}';

COMMENT ON COLUMN orders.store_notified_at IS 'Timestamp cuando se notificó a la tienda sobre el nuevo pedido';
COMMENT ON COLUMN orders.customer_notified_at IS 'Timestamp cuando se notificó al cliente sobre la confirmación';
COMMENT ON COLUMN orders.notification_status IS 'Estado de las notificaciones enviadas (WhatsApp, push, etc.)';

-- 3. TABLA DE COLA DE WHATSAPP
-- ===================================================================

-- Tabla para hacer tracking de mensajes WhatsApp encolados
CREATE TABLE IF NOT EXISTS whatsapp_message_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('customer_confirmation', 'status_update', 'delivery_notification')),
  recipient_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  template_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para whatsapp_message_queue
ALTER TABLE whatsapp_message_queue ENABLE ROW LEVEL SECURITY;

-- Los stores pueden ver solo sus propias colas de mensajes
DROP POLICY IF EXISTS "stores_own_whatsapp_queue" ON whatsapp_message_queue;
CREATE POLICY "stores_own_whatsapp_queue" 
ON whatsapp_message_queue 
FOR ALL 
USING (store_id = (current_setting('app.current_store_id', true))::UUID);

-- Índices para optimizar consultas de la cola
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_store_id ON whatsapp_message_queue(store_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_order_id ON whatsapp_message_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_scheduled_at ON whatsapp_message_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_job_id ON whatsapp_message_queue(job_id);

-- Trigger para actualizar updated_at en la cola
CREATE OR REPLACE FUNCTION update_whatsapp_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_whatsapp_queue_updated_at ON whatsapp_message_queue;
CREATE TRIGGER update_whatsapp_queue_updated_at
  BEFORE UPDATE ON whatsapp_message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_queue_updated_at();

-- 4. CAMPOS DE WHATSAPP CLOUD API EN STORE_SETTINGS
-- ===================================================================

-- Agregar campos de WhatsApp Cloud API a store_settings
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS wa_business_account_id TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS wa_access_token TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS wa_api_version TEXT DEFAULT 'v20.0';

-- Comentarios para documentar los campos
COMMENT ON COLUMN store_settings.wa_phone_number_id IS 'Phone Number ID de WhatsApp Business Cloud API';
COMMENT ON COLUMN store_settings.wa_business_account_id IS 'Business Account ID de WhatsApp Business';
COMMENT ON COLUMN store_settings.wa_access_token IS 'Access Token para WhatsApp Cloud API';
COMMENT ON COLUMN store_settings.wa_api_version IS 'Versión de la API de WhatsApp (default: v20.0)';

-- Agregar índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_store_settings_wa_phone_number_id ON store_settings(wa_phone_number_id);

-- 5. TABLA DE EVENTOS DE WEBHOOK DE WHATSAPP
-- ===================================================================

-- Tabla para eventos de webhook de WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  phone_number_id TEXT,
  entry_id TEXT,
  change_field TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para whatsapp_webhook_events
ALTER TABLE whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

-- Los stores pueden ver solo sus propios eventos de webhook
DROP POLICY IF EXISTS "stores_own_whatsapp_webhooks" ON whatsapp_webhook_events;
CREATE POLICY "stores_own_whatsapp_webhooks" 
ON whatsapp_webhook_events 
FOR ALL 
USING (store_id = (current_setting('app.current_store_id', true))::UUID);

-- Índices para la tabla de eventos
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_store_id ON whatsapp_webhook_events(store_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_phone_id ON whatsapp_webhook_events(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_created_at ON whatsapp_webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_processed ON whatsapp_webhook_events(processed);

COMMENT ON TABLE whatsapp_webhook_events IS 'Eventos recibidos del webhook de WhatsApp Cloud API';

-- ===================================================================
-- VERIFICACIÓN FINAL
-- ===================================================================

-- Mostrar resumen de tablas creadas
SELECT 'TABLAS CREADAS:' as resultado;
SELECT 
  tablename as tabla_creada,
  schemaname as esquema
FROM pg_tables 
WHERE tablename IN ('push_subscriptions', 'whatsapp_message_queue', 'whatsapp_webhook_events')
ORDER BY tablename;

SELECT 'CAMPOS AGREGADOS A ORDERS:' as resultado;
SELECT 
  column_name as campo_agregado,
  data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('store_notified_at', 'customer_notified_at', 'notification_status')
ORDER BY column_name;

SELECT 'CAMPOS DE WHATSAPP EN STORE_SETTINGS:' as resultado;
SELECT 
  column_name as campo_whatsapp,
  data_type as tipo_dato
FROM information_schema.columns 
WHERE table_name = 'store_settings' 
AND column_name LIKE '%wa_%'
ORDER BY column_name;

SELECT '✅ SCRIPT COMPLETADO EXITOSAMENTE' as resultado;
