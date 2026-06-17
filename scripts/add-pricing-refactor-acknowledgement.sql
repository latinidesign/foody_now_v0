-- Banner de aviso por el refactor de precios: el campo price_modifier de product_option_values
-- paso de ser un delta sobre products.price a ser el precio absoluto de la variedad.
-- Esta columna guarda cuando el owner confirmo estar al tanto del cambio.
-- tasks/05-pricing-absolute-varieties.md
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS pricing_refactor_acknowledged_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN store_settings.pricing_refactor_acknowledged_at IS
  'Fecha en que el owner confirmo estar al tanto del cambio de modelo de precios (delta a absoluto). NULL = pendiente de mostrar el banner.';
