# Checkout API con Service Role

Esta guía resume los puntos clave para mantener operativo el flujo de pagos directos con Mercado Pago (Checkout API) usando el cliente admin de Supabase y deja preparado el terreno para otros proveedores.

## Endpoints críticos

- `app/api/orders/route.ts` crea la orden y los ítems utilizando `createAdminClient()` con `runtime = "nodejs"`.
- `app/api/payments/charge/route.ts` consume Checkout API con el token generado en el frontend, inserta/actualiza `payments` por `provider,provider_payment_id` y normaliza el estado de la orden.
- `app/api/webhooks/mercadopago/route.ts` concilia los webhooks, realiza `upsert` sobre `payments` por `provider,provider_payment_id` y actualiza el estado de la orden.

Todos los handlers deben devolver errores en formato `{ error, cid }` para facilitar la trazabilidad en los logs.

## Variables de entorno

Asegúrate de definir en todos los entornos:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_BASE_URL`

> 💡 **Importante**
>
> - `SUPABASE_SERVICE_ROLE_KEY` se obtiene desde **Supabase → Project Settings → API → service_role** y debe almacenarse sólo en variables privadas del servidor (Vercel, Render, `.env.local`, etc.).
> - No utilices `createAdminClient()` ni esta variable en componentes ejecutados en el navegador; está pensada exclusivamente para rutas y acciones del servidor.
> - Verifica que `NEXT_PUBLIC_SUPABASE_URL` siga apuntando al mismo proyecto que utiliza el resto de la aplicación.

## Flujo resumido

1. El frontend crea la orden (`POST /api/orders`).
2. Tokeniza el medio de pago (tarjeta o billetera) desde el subdominio correspondiente y envía el token a `POST /api/payments/charge`.
3. El backend ejecuta `v1/payments` de Mercado Pago con las credenciales de la tienda, actualiza `payments` y sincroniza `orders.status` y `orders.payment_status`.
4. Los webhooks de Mercado Pago llegan a `/api/webhooks/mercadopago` y garantizan idempotencia en caso de reintentos o conciliaciones posteriores.

## Pruebas recomendadas

1. Crear una orden desde el checkout y validar que se insertan orden e ítems.
2. Crear un pago directo (`POST /api/payments/charge`) y confirmar que `payments` guarda `provider = mercadopago`, `provider_payment_id` y `status`.
3. Simular un webhook de Mercado Pago y verificar que `payments` se actualiza por `provider,provider_payment_id` y la orden cambia a `confirmed/completed`.
