-- Agregar campo de descuento por pago en efectivo a store_settings
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS cash_discount_percent INTEGER DEFAULT NULL;

COMMENT ON COLUMN store_settings.cash_discount_percent IS 'Porcentaje de descuento por pago en efectivo (1-99). NULL = deshabilitado.';
