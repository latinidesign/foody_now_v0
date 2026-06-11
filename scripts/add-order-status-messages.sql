-- Agregar columna para mensajes personalizados por estado de pedido
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS order_status_messages JSONB DEFAULT NULL;

COMMENT ON COLUMN store_settings.order_status_messages IS 'Mensajes personalizados por estado del pedido. JSON: { "confirmed": "...", "preparing": "...", "ready": "...", "sent": "...", "delivered": "...", "cancelled": "..." }';
