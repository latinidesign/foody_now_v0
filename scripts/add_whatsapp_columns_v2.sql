-- Add missing columns for WhatsApp configuration
-- This script adds the necessary columns to support WhatsApp and Twilio configuration

-- Add Twilio configuration columns to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS twilio_account_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_auth_token TEXT,
ADD COLUMN IF NOT EXISTS twilio_whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_message TEXT DEFAULT 'Gracias por tu pedido. Te contactaremos pronto para confirmar los detalles.';

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
