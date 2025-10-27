-- ===================================================================
-- SCRIPT PARA LIMPIAR Y RECREAR SISTEMA DE NOTIFICACIONES
-- Ejecutar después del diagnóstico exitoso
-- ===================================================================

-- Primero eliminamos las tablas de notificaciones si existen (para evitar conflictos)
DROP TABLE IF EXISTS whatsapp_webhook_events CASCADE;
DROP TABLE IF EXISTS whatsapp_message_queue CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;

-- Eliminamos funciones que puedan existir
DROP FUNCTION IF EXISTS update_push_subscriptions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_whatsapp_queue_updated_at() CASCADE;

-- 1. TABLA DE SUSCRIPCIONES PUSH
-- ===================================================================

CREATE TABLE push_subscriptions (
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

CREATE POLICY "stores_own_push_subscriptions" 
ON push_subscriptions 
FOR ALL 
USING (store_id = (current_setting('app.current_store_id', true))::UUID);

-- Índices
CREATE INDEX idx_push_subscriptions_store_id ON push_subscriptions(store_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Función y trigger para updated_at
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- 2. AGREGAR CAMPOS DE NOTIFICACIÓN A ORDERS (solo si no existen)
-- ===================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND table_schema = 'public' 
        AND column_name = 'store_notified_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN store_notified_at TIMESTAMPTZ;
        RAISE NOTICE 'Columna store_notified_at agregada a orders';
    ELSE
        RAISE NOTICE 'Columna store_notified_at ya existe en orders';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND table_schema = 'public' 
        AND column_name = 'customer_notified_at'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_notified_at TIMESTAMPTZ;
        RAISE NOTICE 'Columna customer_notified_at agregada a orders';
    ELSE
        RAISE NOTICE 'Columna customer_notified_at ya existe en orders';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND table_schema = 'public' 
        AND column_name = 'notification_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN notification_status JSONB DEFAULT '{}';
        RAISE NOTICE 'Columna notification_status agregada a orders';
    ELSE
        RAISE NOTICE 'Columna notification_status ya existe en orders';
    END IF;
END
$$;

-- Comentarios para los campos de orders
COMMENT ON COLUMN orders.store_notified_at IS 'Timestamp cuando se notificó a la tienda sobre el nuevo pedido';
COMMENT ON COLUMN orders.customer_notified_at IS 'Timestamp cuando se notificó al cliente sobre la confirmación';
COMMENT ON COLUMN orders.notification_status IS 'Estado de las notificaciones enviadas (WhatsApp, push, etc.)';

-- 3. TABLA DE COLA DE WHATSAPP
-- ===================================================================

CREATE TABLE whatsapp_message_queue (
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

-- Índices para la cola de WhatsApp
CREATE INDEX idx_whatsapp_queue_store_id ON whatsapp_message_queue(store_id);
CREATE INDEX idx_whatsapp_queue_order_id ON whatsapp_message_queue(order_id);
CREATE INDEX idx_whatsapp_queue_status ON whatsapp_message_queue(status);
CREATE INDEX idx_whatsapp_queue_scheduled_at ON whatsapp_message_queue(scheduled_at);
CREATE INDEX idx_whatsapp_queue_job_id ON whatsapp_message_queue(job_id);

-- Función y trigger para updated_at en la cola
CREATE OR REPLACE FUNCTION update_whatsapp_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_queue_updated_at
  BEFORE UPDATE ON whatsapp_message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_queue_updated_at();

-- 4. AGREGAR CAMPOS DE WHATSAPP A STORE_SETTINGS
-- ===================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_settings' 
        AND table_schema = 'public' 
        AND column_name = 'wa_phone_number_id'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN wa_phone_number_id TEXT;
        RAISE NOTICE 'Columna wa_phone_number_id agregada a store_settings';
    ELSE
        RAISE NOTICE 'Columna wa_phone_number_id ya existe en store_settings';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_settings' 
        AND table_schema = 'public' 
        AND column_name = 'wa_business_account_id'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN wa_business_account_id TEXT;
        RAISE NOTICE 'Columna wa_business_account_id agregada a store_settings';
    ELSE
        RAISE NOTICE 'Columna wa_business_account_id ya existe en store_settings';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_settings' 
        AND table_schema = 'public' 
        AND column_name = 'wa_access_token'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN wa_access_token TEXT;
        RAISE NOTICE 'Columna wa_access_token agregada a store_settings';
    ELSE
        RAISE NOTICE 'Columna wa_access_token ya existe en store_settings';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'store_settings' 
        AND table_schema = 'public' 
        AND column_name = 'wa_api_version'
    ) THEN
        ALTER TABLE store_settings ADD COLUMN wa_api_version TEXT DEFAULT 'v20.0';
        RAISE NOTICE 'Columna wa_api_version agregada a store_settings';
    ELSE
        RAISE NOTICE 'Columna wa_api_version ya existe en store_settings';
    END IF;
END
$$;

-- Comentarios para los campos de WhatsApp
COMMENT ON COLUMN store_settings.wa_phone_number_id IS 'Phone Number ID de WhatsApp Business Cloud API';
COMMENT ON COLUMN store_settings.wa_business_account_id IS 'Business Account ID de WhatsApp Business';
COMMENT ON COLUMN store_settings.wa_access_token IS 'Access Token para WhatsApp Cloud API';
COMMENT ON COLUMN store_settings.wa_api_version IS 'Versión de la API de WhatsApp (default: v20.0)';

-- Índice para optimizar consultas de WhatsApp
CREATE INDEX IF NOT EXISTS idx_store_settings_wa_phone_number_id ON store_settings(wa_phone_number_id);

-- 5. TABLA DE EVENTOS DE WEBHOOK DE WHATSAPP
-- ===================================================================

CREATE TABLE whatsapp_webhook_events (
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

CREATE POLICY "stores_own_whatsapp_webhooks" 
ON whatsapp_webhook_events 
FOR ALL 
USING (store_id = (current_setting('app.current_store_id', true))::UUID);

-- Índices para la tabla de eventos
CREATE INDEX idx_whatsapp_webhooks_store_id ON whatsapp_webhook_events(store_id);
CREATE INDEX idx_whatsapp_webhooks_phone_id ON whatsapp_webhook_events(phone_number_id);
CREATE INDEX idx_whatsapp_webhooks_created_at ON whatsapp_webhook_events(created_at);
CREATE INDEX idx_whatsapp_webhooks_processed ON whatsapp_webhook_events(processed);

COMMENT ON TABLE whatsapp_webhook_events IS 'Eventos recibidos del webhook de WhatsApp Cloud API';

-- ===================================================================
-- VERIFICACIÓN FINAL
-- ===================================================================

SELECT 'TABLAS DE NOTIFICACIONES CREADAS:' as resultado;
SELECT 
  tablename as tabla_creada,
  schemaname as esquema
FROM pg_tables 
WHERE tablename IN ('push_subscriptions', 'whatsapp_message_queue', 'whatsapp_webhook_events')
  AND schemaname = 'public'
ORDER BY tablename;

SELECT 'CAMPOS EN ORDERS:' as resultado;
SELECT 
  column_name as campo,
  data_type as tipo
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND table_schema = 'public'
  AND column_name IN ('store_notified_at', 'customer_notified_at', 'notification_status')
ORDER BY column_name;

SELECT 'CAMPOS DE WHATSAPP EN STORE_SETTINGS:' as resultado;
SELECT 
  column_name as campo,
  data_type as tipo
FROM information_schema.columns 
WHERE table_name = 'store_settings' 
  AND table_schema = 'public'
  AND column_name LIKE '%wa_%'
ORDER BY column_name;

SELECT '✅ SISTEMA DE NOTIFICACIONES INSTALADO EXITOSAMENTE' as resultado;
