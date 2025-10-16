# Checkout Pro con Service Role

Esta guía resume los puntos clave para mantener operativo el flujo de pagos con Mercado Pago usando el cliente admin de Supabase.

## Endpoints críticos

- `app/api/orders/route.ts` crea la orden y los ítems utilizando `createAdminClient()` con `runtime = "nodejs"`.
- `app/api/payments/create-preference/route.ts` genera la preferencia Checkout Pro a partir de una orden existente y guarda el registro en `payments`.
- `app/api/webhooks/mercadopago/route.ts` concilia los webhooks, realiza `upsert` sobre `payments` por `mp_payment_id` y actualiza el estado de la orden.

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
2. Con el `order_id` llama a `POST /api/payments/create-preference` y redirige al `init_point` devuelto.
3. Mercado Pago notifica a `/api/webhooks/mercadopago`; el backend consulta el pago, actualiza `payments` y sincroniza `orders.status` y `orders.payment_status`.

## Pruebas recomendadas

1. Crear una orden desde el checkout y validar que se insertan orden e ítems.
2. Generar una preferencia y confirmar que `payments` guarda `preference_id` y `status`.
3. Simular un webhook de Mercado Pago y verificar que `payments` se actualiza por `mp_payment_id` y la orden cambia a `confirmed/completed`.
