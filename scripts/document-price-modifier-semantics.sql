-- Actualiza el comentario de la columna price_modifier para reflejar su nueva semantica.
-- Antes: delta sobre products.price.
-- Ahora: precio absoluto de la variedad.
-- tasks/05-pricing-absolute-varieties.md
COMMENT ON COLUMN product_option_values.price_modifier IS
  'Precio absoluto de la variedad en ARS. Antes de 2026-06 era interpretado como un delta sobre products.price; ahora es el precio completo que paga el cliente si elige esta variedad.';
