-- This script adds the necessary columns to support WhatsApp Cloud API configuration

ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT 'Gracias por tu pedido. Te contactaremos pronto para confirmar los detalles.',
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

-- Remove whatsapp_number from stores table if it exists and move to store_settings
-- First, migrate existing data
INSERT INTO store_settings (store_id, whatsapp_number, created_at, updated_at)
SELECT id, phone, created_at, updated_at 
FROM stores 
WHERE phone IS NOT NULL 
AND id NOT IN (SELECT store_id FROM store_settings WHERE store_id IS NOT NULL)
ON CONFLICT (store_id) DO UPDATE SET
  whatsapp_number = EXCLUDED.whatsapp_number,
  updated_at = EXCLUDED.updated_at;

-- Update existing store_settings with phone numbers from stores
UPDATE store_settings 
SET whatsapp_number = stores.phone,
    updated_at = NOW()
FROM stores 
WHERE store_settings.store_id = stores.id 
AND stores.phone IS NOT NULL 
AND (store_settings.whatsapp_number IS NULL OR store_settings.whatsapp_number = '');
