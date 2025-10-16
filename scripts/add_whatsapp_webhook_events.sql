-- Table to persist incoming WhatsApp webhook events by store/phone number
CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  phone_number_id TEXT,
  entry_id TEXT,
  change_field TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS whatsapp_webhook_events_store_idx ON whatsapp_webhook_events(store_id);
CREATE INDEX IF NOT EXISTS whatsapp_webhook_events_phone_idx ON whatsapp_webhook_events(phone_number_id);
