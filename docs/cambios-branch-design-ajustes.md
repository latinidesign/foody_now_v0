# Cambios — branch `design/ajustes`

---

## 1. URL de tienda en formato subdominio

**Contexto:** El link de la tienda que se muestra en el panel de WhatsApp y en el mensaje por defecto pasó de usar la ruta `/store/{slug}` a usar subdominio.

**Formato nuevo:** `https://{slug}.foodynow.com.ar`

**Archivos modificados:**

- `components/admin/whatsapp-settings.tsx` — variable `storeUrl` (línea ~39)
- `lib/whatsapp/client.ts` — método `generateStoreLinkResponse` (línea ~83)

> **Nota para el dev:** Esto es solo el cambio de display. Para que los subdominios funcionen en producción hay que configurar un wildcard DNS (`*.foodynow.com.ar`) y el routing correspondiente en el servidor/CDN.

---

## 2. Fix: CreditCard no definido en mobile sidebar

**Contexto:** La página `/admin` tiraba el error `CreditCard is not defined` porque el ícono se usaba en el array de navegación pero no estaba importado.

**Archivo modificado:**

- `components/admin/mobile-sidebar.tsx` — se agregó `CreditCard` al bloque de imports de `lucide-react`

---

## 3. Label "Configuración de Delivery (Opcional)"

**Contexto:** Se agregó una etiqueta de sección antes de los campos de delivery en el formulario de configuración de la tienda.

**Archivo modificado:**

- `components/admin/store-settings-form.tsx` — se agregó un `<Label>` con texto "Configuración de Delivery (Opcional)" antes del grid con `deliveryRadius`, `deliveryFee` y `minOrderAmount`

---

## 4. Colores de fondo por estado de pedido

**Contexto:** Las filas de la tabla de pedidos en el admin ahora tienen color de fondo según el estado.

| Estado | Color |
|---|---|
| `pending` (Pendiente) | `bg-fuchsia-50` |
| `delivered` (Entregado) | `bg-gray-50` |
| `ready` (Listo) | `bg-lime-50` |
| `sent` (Enviado) | `bg-lime-50` |
| Otros | Sin color de fondo |

**Archivo modificado:**

- `components/admin/orders-table.tsx` — div de cada fila en el `.map()` (~línea 727)

---

## 5. Número de pedido secuencial por tienda

**Contexto:** El ID mostrado al usuario pasó de ser los últimos 8 caracteres del UUID (ej. `#a1b2c3d4`) a un número secuencial de 6 dígitos con ceros a la izquierda (ej. `#000231`), reiniciando desde 1 por cada tienda.

El UUID interno (`id`) **no se tocó** — sigue siendo la clave en todas las rutas, queries a Supabase, webhooks y referencias a MercadoPago.

### Migración de base de datos — REQUERIDA

Ejecutar el script en Supabase SQL Editor:

**`scripts/15-order-number-safe.sql`** (archivo nuevo y recomendado)

> Nota: este script evita race conditions con una serialización por `store_id` y agrega un índice único de seguridad.

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number INTEGER;

WITH numbered AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY store_id ORDER BY created_at ASC) AS rn
  FROM orders WHERE order_number IS NULL
)
UPDATE orders SET order_number = numbered.rn
FROM numbered WHERE orders.id = numbered.id;

-- Agrega un índice único para asegurar un único order_number por tienda.
CREATE UNIQUE INDEX IF NOT EXISTS orders_store_order_number_unique_idx
  ON orders (store_id, order_number);

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.store_id::text)::bigint);

  SELECT COALESCE(MAX(order_number), 0) + 1
  INTO next_num FROM orders WHERE store_id = NEW.store_id;

  NEW.order_number := next_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW WHEN (NEW.order_number IS NULL)
EXECUTE FUNCTION set_order_number();
```

### Cambios en código

**Nuevos archivos:**
- `scripts/15-order-number-safe.sql`
- `scripts/15-order-number.sql` (migración original)

**Archivos modificados:**

| Archivo | Cambio |
|---|---|
| `lib/types/database.ts` | Se agregó `order_number?: number` a la interfaz `Order` |
| `lib/utils.ts` | Se agregó función `formatOrderNumber(n)` → `"000231"` |
| `components/admin/orders-table.tsx` | Todos los `.id.slice(-8)` reemplazados por `formatOrderNumber(order.order_number)` (9 ocurrencias en mensajes WhatsApp, ticket de impresión y lista) |
| `components/admin/recent-orders.tsx` | Misma sustitución en el widget de pedidos recientes |
| `app/store/payment/success/page.tsx` | Misma sustitución |
| `app/store/payment/failure/page.tsx` | Misma sustitución |
| `app/store/[slug]/order/[orderId]/page.tsx` | Misma sustitución |
| `app/store/[slug]/success/page.tsx` | Misma sustitución |

### Función helper agregada en `lib/utils.ts`

```typescript
export function formatOrderNumber(n?: number | null): string {
  return n != null ? String(n).padStart(6, "0") : "------"
}
```

---

## 6. Actualización de página /admin/help

**Contexto:** Se reemplazó todo el contenido de texto de la página de ayuda del panel admin por el contenido del archivo `Centro_Ayuda_FoodyNow.md`, manteniendo el mismo estilo visual.

**Archivo modificado:**

- `app/admin/help/page.tsx`

**Detalles del cambio:**

- Contenido reemplazado íntegramente desde `Centro_Ayuda_FoodyNow.md`
- Estilo visual conservado: misma estructura de secciones, `h2`, listas `list-disc`/`list-decimal`, `font-bold text-accent` para términos destacados
- IDs de navegación actualizados para coincidir con las nuevas secciones:

| ID anterior | ID nuevo | Sección |
|---|---|---|
| `whatsapp` | `comunicacion` | Comunicación |
| `operacion-store` | `recomendaciones` | Recomendaciones |
| `notificaciones` | _(eliminada)_ | — |
| _(nueva)_ | `suscripcion` | Suscripción |
| _(nueva)_ | `compartir` | Listo para compartir |

- Array `sections` actualizado con las 9 secciones nuevas que alimentan el grid de navegación
- El componente `ScrollToTop` ya existía y se conservó sin cambios

---

## Resumen de archivos tocados

```
scripts/15-order-number-safe.sql      ← NUEVO — ejecutar en Supabase (recomendado)
scripts/15-order-number.sql           ← NUEVO — migración original
lib/types/database.ts
lib/utils.ts
lib/whatsapp/client.ts
components/admin/admin-sidebar.tsx    (pre-existente, sin cambios aquí)
components/admin/mobile-sidebar.tsx
components/admin/orders-table.tsx
components/admin/recent-orders.tsx
components/admin/store-settings-form.tsx
components/admin/whatsapp-settings.tsx
app/admin/help/page.tsx
app/store/[slug]/order/[orderId]/page.tsx
app/store/[slug]/success/page.tsx
app/store/payment/success/page.tsx
app/store/payment/failure/page.tsx
```