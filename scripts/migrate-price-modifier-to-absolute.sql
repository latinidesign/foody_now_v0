-- Migracion de precios: convierte price_modifier de delta a absoluto.
-- Antes de 2026-06, price_modifier era la diferencia entre el precio de la variedad
-- y products.price (o products.sale_price si estaba en oferta).
-- A partir del refactor (tasks/05-pricing-absolute-varieties.md), price_modifier
-- es el precio COMPLETO de la variedad.
--
-- IMPORTANTE: confirmar con el dueno del proyecto antes de ejecutar.
-- Asuncion: products.price (o sale_price) no fue modificado despues de cargar las options.
-- Si el dueno ya habia ajustado precios de varieties pensando como deltas,
-- este script convertira correctamente. Si habia mezclas, revisar caso por caso.
--
-- Solo afecta productos SIN pricing_config (los que usaban el modelo de deltas).
-- Productos con pricing_config (packs, empanadas) no se tocan: el cliente paga
-- el unit_price del pricing_config, y el price_modifier de las varieties se ignora.

BEGIN;

UPDATE product_option_values pov
SET price_modifier = pov.price_modifier + COALESCE(p.sale_price, p.price)
FROM product_options po
JOIN products p ON p.id = po.product_id
WHERE po.id = pov.option_id
  AND pov.price_modifier IS NOT NULL
  AND pov.price_modifier <> 0
  AND p.pricing_config IS NULL;

COMMIT;

-- Verificacion posterior:
-- SELECT COUNT(*) FROM product_option_values WHERE price_modifier < 0;  -- esperado 0
-- SELECT s.name, COUNT(*), MIN(pov.price_modifier), MAX(pov.price_modifier)
-- FROM product_option_values pov
-- JOIN product_options po ON po.id = pov.option_id
-- JOIN products p ON p.id = po.product_id
-- JOIN stores s ON s.id = p.store_id
-- WHERE p.pricing_config IS NULL
-- GROUP BY s.id, s.name
-- ORDER BY s.name;
