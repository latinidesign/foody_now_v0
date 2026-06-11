-- Agrega columna is_available a product_options y product_option_values
-- para permitir marcar opciones y valores como no disponibles sin afectar
-- al producto padre ni a la opción contenedora.

ALTER TABLE product_options
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;

ALTER TABLE product_option_values
ADD COLUMN IF NOT EXISTS is_available boolean DEFAULT true;
