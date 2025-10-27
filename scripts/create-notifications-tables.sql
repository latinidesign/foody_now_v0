-- Script consolidado para crear todas las tablas de notificaciones
-- Ejecutar en Supabase SQL Editor

-- 1. Tabla para suscripciones de push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id)
);

-- RLS para push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para que stores accedan solo a sus suscripciones
CREATE POLICY "stores_own_push_subscriptions" 
ON push_subscriptions 
FOR ALL 
USING (store_id = (current_setting('app.current_store_id', true))::UUID);

-- Índices para push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_store_id ON push_subscriptions(store_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- 2. Agregar columnas de tracking a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_status JSONB DEFAULT '{}';

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN orders.store_notified_at IS 'Timestamp cuando se notificó a la tienda sobre el nuevo pedido';
COMMENT ON COLUMN orders.customer_notified_at IS 'Timestamp cuando se notificó al cliente sobre la confirmación';
COMMENT ON COLUMN orders.notification_status IS 'Estado de las notificaciones enviadas (WhatsApp, push, etc.)';

-- 3. Verificar campos WhatsApp en store_settings (deberían existir)
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS wa_business_account_id TEXT,
ADD COLUMN IF NOT EXISTS wa_access_token TEXT,
ADD COLUMN IF NOT EXISTS wa_api_version TEXT DEFAULT 'v20.0',
ADD COLUMN IF NOT EXISTS wa_metadata JSONB DEFAULT '{}';

-- 4. Tabla para eventos de webhook WhatsApp (ya debería existir)
CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  phone_number_id TEXT,
  entry_id TEXT,
  change_field TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para whatsapp_webhook_events
CREATE INDEX IF NOT EXISTS whatsapp_webhook_events_store_idx ON whatsapp_webhook_events(store_id);
CREATE INDEX IF NOT EXISTS whatsapp_webhook_events_phone_idx ON whatsapp_webhook_events(phone_number_id);

-- 5. Funciones para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para push_subscriptions
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Opcional: Tabla para queue persistente (actualmente usamos memoria)
-- Esta tabla NO es necesaria para el funcionamiento actual, pero la incluyo para futuro
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

CREATE POLICY "stores_own_whatsapp_queue" 
ON whatsapp_message_queue 
FOR ALL 
USING (store_id = (current_setting('app.current_store_id', true))::UUID);

-- Índices para whatsapp_message_queue
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_store_id ON whatsapp_message_queue(store_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_order_id ON whatsapp_message_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_scheduled_at ON whatsapp_message_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_job_id ON whatsapp_message_queue(job_id);

-- Trigger para whatsapp_message_queue
DROP TRIGGER IF EXISTS update_whatsapp_queue_updated_at ON whatsapp_message_queue;
CREATE TRIGGER update_whatsapp_queue_updated_at
  BEFORE UPDATE ON whatsapp_message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Mensaje final
SELECT 'Tablas de notificaciones creadas correctamente' as resultado;
