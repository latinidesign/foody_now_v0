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

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- Agregar columnas de control a la tabla orders para tracking de notificaciones
ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_notified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_status JSONB DEFAULT '{}';

COMMENT ON COLUMN orders.store_notified_at IS 'Timestamp cuando se notificó a la tienda sobre el nuevo pedido';
COMMENT ON COLUMN orders.customer_notified_at IS 'Timestamp cuando se notificó al cliente sobre la confirmación';
COMMENT ON COLUMN orders.notification_status IS 'Estado de las notificaciones enviadas (WhatsApp, push, etc.)';

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

CREATE TRIGGER update_whatsapp_queue_updated_at
  BEFORE UPDATE ON whatsapp_message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_queue_updated_at();
