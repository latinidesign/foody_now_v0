-- Ejecutando script para agregar campos de WhatsApp
-- Add WhatsApp phone field to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT true;

-- Add notification preferences to stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"order_created": true, "order_paid": true, "order_ready": true}';

-- Update existing stores with default notification settings
UPDATE stores 
SET notification_settings = '{"order_created": true, "order_paid": true, "order_ready": true}'
WHERE notification_settings IS NULL;
