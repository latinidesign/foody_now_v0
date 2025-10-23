-- This script adds the necessary columns to support WhatsApp Cloud API configuration

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT 'Gracias por tu pedido. Te contactaremos pronto para confirmar los detalles.';

-- Add WhatsApp Cloud API configuration columns to store_settings table
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wa_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS wa_business_account_id TEXT,
ADD COLUMN IF NOT EXISTS wa_access_token TEXT,
ADD COLUMN IF NOT EXISTS wa_metadata JSONB DEFAULT '{}'::jsonb;

-- Persist any legacy Twilio configuration inside wa_metadata before removing those columns
UPDATE store_settings
SET wa_metadata = COALESCE(wa_metadata, '{}'::jsonb) || jsonb_strip_nulls(
    jsonb_build_object(
      'legacy_twilio_account_sid', twilio_account_sid,
      'legacy_twilio_auth_token', twilio_auth_token,
      'legacy_twilio_whatsapp_number', twilio_whatsapp_number
    )
  )
WHERE twilio_account_sid IS NOT NULL
   OR twilio_auth_token IS NOT NULL
   OR twilio_whatsapp_number IS NOT NULL;

-- Remove deprecated Twilio columns
ALTER TABLE store_settings
DROP COLUMN IF EXISTS twilio_account_sid,
DROP COLUMN IF EXISTS twilio_auth_token,
DROP COLUMN IF EXISTS twilio_whatsapp_number;

-- Update existing stores to have a default WhatsApp message
UPDATE stores 
SET whatsapp_message = 'Gracias por tu pedido. Te contactaremos pronto para confirmar los detalles.'
WHERE whatsapp_message IS NULL;
