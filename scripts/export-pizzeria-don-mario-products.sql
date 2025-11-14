-- Ejecutar en el editor SQL de Supabase y usar la opción "Download as CSV".
--
-- Para automatizar la descarga desde un script o terminal, usa:
--   SUPABASE_DB_URL="postgres://..." ./export-pizzeria-don-mario-products.sh salida.csv
-- (requiere el cliente `psql` instalado en tu máquina local).

COPY (
    SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.price,
        p.sale_price,
        p.is_available,
        p.sort_order AS product_sort_order,
        p.created_at AS product_created_at,
        p.updated_at AS product_updated_at,
        c.id AS category_id,
        c.name AS category_name,
        c.sort_order AS category_sort_order,
        s.id AS store_id,
        s.name AS store_name,
        s.slug AS store_slug
    FROM products p
    INNER JOIN stores s ON s.id = p.store_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE s.slug = 'pizzeria-don-mario'
    ORDER BY c.sort_order NULLS LAST, p.sort_order, p.name
) TO STDOUT WITH CSV HEADER;
