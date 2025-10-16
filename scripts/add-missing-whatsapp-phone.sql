-- Add missing WhatsApp phone column for stores without altering existing structure
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20);