# Migration & Deployment Guide: Order Number Feature

## Problema resuelto

1. **Race condition evitada**: Anteriormente, si una orden fallaba durante la creación (ej: sin items), el `order_number` se asignaba igualmente vía trigger, "saltando" números.
   - **Solución**: Movida la lógica de asignación de `order_number` a la capa de aplicación, usando una tabla de secuencias (`order_number_sequences`) y la función `get_next_order_number()`.
   - **Beneficio**: Si la inserción falla, no se consume número.

2. **UI completada**: El `order_number` ahora se muestra en todas las vistas:
   - Vista de pedidos (`/admin/orders`)
   - Vista de información general (`/admin`)
   - Páginas de cliente (éxito, detalles)

## Scripts de migración a ejecutar EN ORDEN

### 1. Script seguro de orden numbers (si no se ejecutó antes)

```bash
scripts/15-order-number-safe.sql
```

Crea:
- Columna `order_number` si no existe
- Índice único `(store_id, order_number)`
- Función `set_order_number()` y trigger (todavía no removemos por compatibilidad)

### 2. Script de secuencias (NUEVO - resolver race condition)

```bash
scripts/16-order-number-sequences.sql
```

Crea:
- Tabla `order_number_sequences`
- Función `get_next_order_number(p_store_id)` que obtiene el número de forma atómica
- Backfill de secuencias desde órdenes existentes
- Remueve el trigger BEFORE INSERT

**Importante**: Ejecutar DESPUÉS del script 15.

## Cambios en la aplicación

### Rutas actualizadas

- `app/api/orders/route.ts`
  - Antes de insertar orden, obtiene `order_number` vía `get_next_order_number()`
  - Incluye `order_number` en el INSERT
  - Si falla el RPC, no intenta insertar

- `app/api/orders/create-cash/route.ts`
  - Mismo cambio que en `route.ts`

### UI actualizada

- `app/admin/orders/page.tsx`
  - SELECT ahora incluye `order_number`
- `components/admin/orders-table.tsx`
  - Ya mostraba `#{formatOrderNumber(order.order_number)}`

## Deployment checklist

- [ ] Ejecutar `scripts/15-order-number-safe.sql` en Supabase (si no está hecho)
- [ ] Ejecutar `scripts/16-order-number-sequences.sql` en Supabase
- [ ] Validar en SQL:
  ```sql
  SELECT * FROM order_number_sequences LIMIT 5;
  SELECT get_next_order_number('test-store-id'::uuid);
  ```
- [ ] Build: `npm run build` (o `pnpm build`)
- [ ] Test en staging:
  - Crear orden con items → debe recibir número
  - Intentar crear orden sin items → debe fallar sin consumir número
  - Verificar números secuenciales por tienda
- [ ] Deploy a producción

## Verificación post-deploy

```sql
-- Verificar que los números son secuenciales por tienda
SELECT store_id, order_number, customer_name, created_at
FROM orders
WHERE order_number IS NOT NULL
ORDER BY store_id, created_at
LIMIT 20;

-- Verificar que no hay duplicados
SELECT store_id, order_number, COUNT(*) AS cnt
FROM orders
WHERE order_number IS NOT NULL
GROUP BY store_id, order_number
HAVING COUNT(*) > 1;
```

## Rollback (si es necesario)

Si algo sale mal:

```sql
-- Revertir a trigger automático (menos seguro, pero funcional)
DROP FUNCTION IF EXISTS get_next_order_number(uuid);
DROP TABLE IF EXISTS order_number_sequences;
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION set_order_number();
```

---

**Fecha de implementación**: 2 de junio, 2026
**Rama**: main (ya mergeado desde `design/ajustes`)
