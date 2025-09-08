-- Add missing columns for WhatsApp configuration
-- This script adds the necessary columns to support WhatsApp and Twilio configuration

-- Add whatsapp_message column to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT 'Gracias por tu pedido. Te contactaremos pronto para confirmar los detalles.';

-- Add Twilio configuration columns to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
ADD COLUMN IF NOT EXISTS twilio_whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT false;

-- Update existing stores to have a default WhatsApp message
UPDATE stores 
SET whatsapp_message = 'Gracias por tu pedido. Te contactaremos pronto para confirmar los detalles.'
WHERE whatsapp_message IS NULL;
