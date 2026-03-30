# Inventario Supabase (código local)

> No tengo acceso directo a tu instancia de Supabase. Este inventario se arma leyendo los scripts SQL y el código del repo. Úsalo como guía para limpiar/ordenar y luego validar en la BD real con `information_schema`/`pg_tables`.

## Fuente “canónica” recomendada
- Core ecommerce: `scripts/01-create-tables-fixed.sql` (sin comandos superuser). `scripts/01-create-tables.sql` es la versión vieja (incluye `checkout_sessions` y un `ALTER DATABASE` prohibido).
- Suscripciones (tiendas): `scripts/subscription-system.sql`.
- Suscripciones (usuarios): `scripts/create-user-subscriptions-table.sql` + `scripts/add-trial-support.sql`.
- Notificaciones/WhatsApp: `scripts/create-notifications-tables.sql` (versión consolidada). Hay varias variantes (`setup-complete-notifications*.sql`, `setup-notifications-clean.sql`, `add-notifications-tables.sql`) que repiten lo mismo.

## Tablas principales (core ecommerce)
- `stores` (id, owner_id→auth.users, slug único, datos de branding/envío). Usada en todo el frontend y admin.
- `categories` (store_id→stores). Usada en catálogo.
- `products` (store_id, category_id). Usada en catálogo.
- `product_options` / `product_option_values` (product_id→products, option_id→product_options). Usado en customización de productos.
- `orders` (store_id→stores, delivery_type enum, payment_status enum). Usada en pedidos y webhooks de pago.
- `order_items` (order_id→orders, product_id→products, selected_options JSONB).
- `store_settings` (store_id UNIQUE→stores, horarios `business_hours`, flags MercadoPago/WhatsApp, `is_open`). Usada en: home de tienda, menú lateral, horarios de atención, pagos, etc.
- `checkout_sessions` (solo en `01-create-tables.sql`; preferencia MP, `external_reference`, `order_id`). Usada por el flujo de pagos (`app/api/payments/*`, webhooks MP, páginas success/failure/pending).

## Notificaciones / WhatsApp
- `push_subscriptions` (store_id→stores, endpoint/p256dh/auth). Usada por `app/api/notifications/*`.
- `whatsapp_webhook_events` (store_id opcional, payload). Usada por `app/api/webhook/whatsapp`.
- `whatsapp_message_queue` (store_id/order_id, job_id, status…). Solo referenciada en scripts; no hay uso en app hoy (cola opcional para persistir envíos WA).
- Columnas adicionales en `store_settings`: `wa_phone_number_id`, `wa_business_account_id`, `wa_access_token`, `wa_api_version`, `wa_metadata`. Agregadas por scripts de notificaciones.
- Columnas adicionales en `orders`: `store_notified_at`, `customer_notified_at`, `notification_status` (tracking de notificaciones).

## Suscripciones (modelo tiendas)
- Enums: `subscription_status`, `payment_frequency`, `subscription_payment_status`.
- `subscription_plans` (planes, features, price, frecuencia). Usado por `lib/services/subscription-service.ts`, APIs `/api/subscription/*`, admin de suscripciones.
- `subscriptions` (store_id UNIQUE→stores, plan_id→subscription_plans, trial/paid ranges, mp ids). Usado en lógica de acceso de tienda y webhooks MP.
- `subscription_payments` (subscription_id→subscriptions, plan_id→subscription_plans, period_start/end, estado MP). Usado en `lib/services/subscription-service.ts` y webhooks.
- `subscription_usage` (subscription_id, métricas por período). No referenciado en app actual; queda como tabla de métricas potencial.
- Alter en `stores`: columnas `subscription_id`, `subscription_status`, `subscription_expires_at` (desde `subscription-system.sql`). Verifica en la BD real si existen y si se usan; en el código actual se consume principalmente la tabla `subscriptions`.

## Suscripciones (modelo usuarios, alternativo)
- `user_subscriptions` (user_id UNIQUE, preapproval_id, status: pending/trial/active/suspended/cancelled, trial dates, next_payment_date). Usada por `/api/subscription/*` (endpoints `create`, `create-new`, `get-status`, `trial-status`, etc.) y múltiples scripts de verificación. Este modelo coexiste con el de `subscriptions` (por tienda).
- Scripts complementarios: `add-trial-support.sql` agrega check y trigger de trial; varios scripts de verificación/reporting (`metricas-negocio.sql`, `verificacion-simple.sql`, etc.).

## Tipos enum
- Core: `delivery_type`, `order_status`, `payment_status`.
- Suscripciones tiendas: `subscription_status`, `payment_frequency`, `subscription_payment_status`.

## Relaciones clave (resumen)
- `stores` ← `categories` ← `products` ← `product_options` ← `product_option_values`
- `stores` ← `orders` ← `order_items`
- `stores` ← `store_settings`
- `stores` ← `checkout_sessions` (y `checkout_sessions` → `orders`)
- `stores` ← `push_subscriptions`, `whatsapp_*`
- Suscripciones tiendas: `stores` ← `subscriptions` → `subscription_plans`; `subscription_payments` → (`subscriptions`, `subscription_plans`); `subscription_usage` → `subscriptions`.
- Suscripciones usuarios: `user_subscriptions` → `auth.users` (lógico, no FK explícita).

## Tablas/columnas duplicadas u obsoletas
- Doble versión del schema base: usar `01-create-tables-fixed.sql` como fuente; `01-create-tables.sql` solo aporta `checkout_sessions`. Si ya está en la BD, mantén `checkout_sessions` pero evita re-ejecutar el script viejo (tiene `ALTER DATABASE`).
- Scripts de notificaciones se repiten con el mismo esquema (`setup-complete-notifications*.sql`, `setup-notifications-clean.sql`, `add-notifications-tables.sql`, `create-notifications-tables.sql`). Quedarse con uno (el “consolidado” o el “fixed”) para evitar drift.
- Columnas WA en `store_settings` y tracking en `orders` se agregan en varios scripts; valida que no estén duplicadas.
- Suscripciones: coexisten dos modelos (por tienda vs por usuario). El código usa ambos en distintas rutas. Evitar mezclar: decide cuál es el actual y migra/elimina el otro si ya no se usa.
- `subscription_usage` no se usa en el código; es candidata a eliminar si no se llena.
- `whatsapp_message_queue` no se usa en runtime (solo scripts). Si no se planea persistir la cola, eliminarla o documentarla como opcional.

## Recomendaciones de limpieza/orden
- Inventariar en la BD real: `select table_name from information_schema.tables where table_schema='public';` y cruzar con este listado.
- Normalizar scripts: conservar solo `01-create-tables-fixed.sql`, `subscription-system.sql`, `create-user-subscriptions-table.sql` (+ `add-trial-support.sql`), `create-notifications-tables.sql`, y migraciones MP específicas. Archivar/eliminar duplicados.
- Elegir un modelo de suscripción (tienda o usuario) y deshabilitar el otro; si conviven, documentar cuándo se usa cada uno.
- Si no se usa la cola WA persistente ni `subscription_usage`, marcarlas para drop tras confirmar que están vacías.
- Documentar en la BD real columnas añadidas por múltiples scripts para evitar recrearlas.
