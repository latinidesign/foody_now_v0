-- Add WhatsApp Business API columns to store_settings table
ALTER TABLE store_settings
ADD COLUMN IF NOT EXISTS wa_phone_number_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS wa_business_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS wa_access_token TEXT,
ADD COLUMN IF NOT EXISTS wa_metadata JSONB;

-- Add comment to document the columns
COMMENT ON COLUMN store_settings.wa_phone_number_id IS 'WhatsApp Business Phone Number ID from Meta';
COMMENT ON COLUMN store_settings.wa_business_account_id IS 'WhatsApp Business Account ID from Meta';
COMMENT ON COLUMN store_settings.wa_access_token IS 'Access token for WhatsApp Business API';
COMMENT ON COLUMN store_settings.wa_metadata IS 'Additional metadata for WhatsApp configuration';
