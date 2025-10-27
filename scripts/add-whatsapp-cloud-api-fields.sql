-- Script para agregar campos de WhatsApp a store_settings si no existen
-- Ejecutar DESPUÉS de add-notifications-tables.sql

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

-- Tabla para eventos de webhook de WhatsApp (si no existe)
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
