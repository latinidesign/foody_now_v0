# Actualización de endpoints de checkout para usar el cliente admin de Supabase

Esta guía describe los pasos para aplicar los cambios que corrigen el error de RLS en la creación de órdenes y pagos con MercadoPago. Sigue cada paso en orden y verifica los diffs sugeridos.

## 1. Usar el cliente admin en `app/api/orders/route.ts`

**Acción**: Sustituir el cliente SSR (`createClient`) por el cliente admin (`createAdminClient`).

```diff
-import { createClient } from "@/lib/supabase/server"
+import { createAdminClient } from "@/lib/supabase/admin"
@@
-    const supabase = await createClient()
+    const supabase = createAdminClient()
```

## 2. Actualizar `app/api/payments/create-preference/route.ts`

**Acción**: Repetir el cambio para que el endpoint que genera la preferencia de pago pueda leer/escribir con la service role.

```diff
-import { createClient } from "@/lib/supabase/server"
+import { createAdminClient } from "@/lib/supabase/admin"
@@
-    const supabase = await createClient()
+    const supabase = createAdminClient()
```

## 3. Ajustar `app/api/payments/webhook/route.ts`

**Acción**: Evitar fallos al actualizar órdenes desde el webhook.

```diff
-import { createClient } from "@/lib/supabase/server"
+import { createAdminClient } from "@/lib/supabase/admin"
@@
-    const body = await request.json()
-    const supabase = await createClient()
+    const body = await request.json()
+    const supabase = createAdminClient()
```

## 4. Verificar variables de entorno

Asegúrate de tener configuradas las siguientes variables en todos los entornos (local, preview y producción):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Sin estas variables, `createAdminClient()` lanzará una excepción.

> 💡 **Importante**
>
> - `SUPABASE_SERVICE_ROLE_KEY` se obtiene desde **Supabase → Project Settings → API → service_role** y debe almacenarse sólo en variables privadas del servidor (Vercel, Render, `.env.local`, etc.).
> - No utilices `createAdminClient()` ni esta variable en componentes ejecutados en el navegador; está pensada exclusivamente para rutas y acciones del servidor.
> - Verifica que `NEXT_PUBLIC_SUPABASE_URL` siga apuntando al mismo proyecto que utiliza el resto de la aplicación.

## 5. Pruebas recomendadas

1. Crear una orden desde el checkout y confirmar que se inserta la orden junto con sus ítems.
2. Generar una preferencia de pago y validar que el `payment_id` se guarda en la orden.
3. Simular un webhook de MercadoPago y verificar que el estado de la orden se actualiza correctamente.
