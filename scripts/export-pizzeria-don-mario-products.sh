#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "Error: se requiere el cliente 'psql' en el PATH para generar el CSV." >&2
  exit 1
fi

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Error: define la variable de entorno SUPABASE_DB_URL con la cadena de conexión de Supabase." >&2
  exit 1
fi

OUTPUT_FILE="${1:-pizzeria-don-mario-products.csv}"

SQL_QUERY=$(cat <<'SQL'
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
SQL
)

psql "${SUPABASE_DB_URL}" \
  --no-psqlrc \
  --quiet \
  --set=ON_ERROR_STOP=1 \
  --command="\\copy ( ${SQL_QUERY} ) TO STDOUT WITH CSV HEADER" \
  > "${OUTPUT_FILE}"

echo "CSV generado en ${OUTPUT_FILE}"
