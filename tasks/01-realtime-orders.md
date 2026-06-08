# tasks/realtime-orders.md

## Objetivo

El panel de pedidos del owner deja de hacer polling cada 15 segundos y pasa a recibir actualizaciones en tiempo real via Supabase Realtime. Cuando llega un pedido nuevo (por cualquier medio de pago), la tabla se actualiza automáticamente sin intervención del usuario y sin esperar un intervalo fijo.

## Scope estricto

**Incluye:**
- Habilitar Replication en Supabase para la tabla `orders` (paso manual en dashboard, prerequisito antes de ejecutar este task)
- Eliminar el `useEffect` que crea el `setInterval` de 15 segundos en `OrdersTable`
- Agregar un `useEffect` que monta una suscripción Realtime a `INSERT` en `orders`, filtrada por `store_id`, que al recibir un evento llama a `refreshOrders()` para traer el pedido completo con joins
- Actualizar la línea del ARCHITECTURE.md que dice "No hay WebSockets ni tiempo real"

**No incluye:**
- Auto-impresión de tickets (segundo task file: `auto-print-orders.md`)
- El campo `printed_at` o `auto_printed` en la tabla `orders`
- QZ Tray ni ninguna integración de impresión
- Refactor del componente `OrdersTable` más allá de los cambios descritos
- Cambios visuales en la UI

**Depende de:**
- Ninguna dependencia previa de código. Requiere acción manual en el dashboard de Supabase antes de ejecutar el task (ver sección Notas para el agente).

## Lógica de negocio

```typescript
// useEffect de suscripción Realtime — agregar en OrdersTable
// Reemplaza el useEffect del setInterval que se elimina

useEffect(() => {
  // Si no hay pedidos aún, no hay store_id disponible — no montar suscripción
  if (ordersData.length === 0) return

  const storeId = ordersData[0].store_id

  // Crear canal suscripto a INSERT en orders filtrado por store_id
  const channel = supabase
    .channel(`orders-realtime-${storeId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`,
      },
      // El payload de Realtime solo incluye la fila base de orders,
      // sin los joins de order_items ni payments.
      // Por eso se llama a refreshOrders() en lugar de usar el payload directamente.
      (_payload) => {
        refreshOrders()
      }
    )
    .subscribe()

  // Cleanup: remover canal al desmontar el componente
  return () => {
    supabase.removeChannel(channel)
  }
}, []) // solo al montar — ordersData viene de SSR y está disponible en el primer render
```

```typescript
// useEffect a ELIMINAR — el setInterval de polling
// Eliminar este bloque completo:

useEffect(() => {
  const interval = setInterval(() => {
    refreshOrders()
  }, 15000)

  return () => clearInterval(interval)
}, [])
```

**Lo que se conserva sin cambios:**
- `refreshOrders()` completo — sigue fetcheando de `/api/admin/orders`
- `isRefreshing` state y el botón "Refrescar ahora" — fallback manual útil
- Todo el resto del componente: filtros, modales, `updateOrderStatus`, `handlePrintTicket`

## Archivos a crear o modificar

```
Modificar:
  components/admin/orders-table.tsx
    — Eliminar useEffect del setInterval (búscar: "cada 15 segundos")
    — Agregar useEffect de suscripción Realtime (ver sección Lógica de negocio)

  ARCHITECTURE.md
    — En sección "Modelo de estado y flujo de datos", reemplazar:
      "No hay WebSockets ni tiempo real"
      por:
      "Supabase Realtime (WebSocket) activo en el panel de pedidos del admin
       para recibir INSERT en la tabla orders en tiempo real.
       No hay otros WebSockets en el sistema."

No tocar:
  app/admin/orders/page.tsx
    — El Server Component no requiere cambios. Sigue pasando orders como prop via SSR.
```

## Restricciones específicas de esta unidad

- No usar `ordersData` como dependencia del `useEffect` de Realtime. El `store_id` se lee una sola vez al montar — los orders iniciales vienen de SSR y están disponibles en el primer render.
- No procesar el payload del evento Realtime para actualizar el estado directamente. Siempre llamar a `refreshOrders()` para garantizar que los joins de `order_items` y `payments` estén presentes.
- No agregar dependencias nuevas al proyecto. Supabase Realtime está disponible en el cliente existente via `getBrowserClient()`.

## Criterio de done

### Quality gate
- [x] `pnpm build` sin errores
- [x] `tsc --noEmit` sin errores de tipos
- [x] Sin errores en consola del browser al montar el componente
- [x] Sin warnings de canal sin cerrar al desmontar el componente

### Smoke test
- [x] Abrir `/admin/orders` con el panel visible
- [x] Crear un pedido de prueba desde la tienda pública (pago en efectivo para simplicidad)
- [x] Verificar que la tabla se actualiza sola en menos de 3 segundos sin tocar "Refrescar ahora"
- [x] Verificar que el botón "Refrescar ahora" sigue funcionando manualmente
- [x] Recargar la página y verificar que los pedidos existentes siguen apareciendo (SSR no se rompe)
- [x] Verificar en consola del browser que no hay errores de suscripción ni canales sin cerrar

## Bugs resueltos durante implementación

1. **Console spam - "Días restantes calculados"**: Removido `console.log()` de `trial-alert.tsx` línea 45
2. **Order number display corruption**: Agregado campo `order_number` a SELECT en `app/api/admin/orders/route.ts`
3. **Hydration mismatch - usePathname()**: Agregado `isMounted` state con `useEffect` guard en `admin-sidebar.tsx`

## Deuda Técnica

### Hydration mismatch residual en AdminSidebar (no bloqueante)
- **Descripción**: Persiste error "Hydration mismatch" en consola al recargar `/admin`
- **Causa**: Diferencias entre rendering de servidor y cliente en `usePathname()` a pesar de guard `isMounted`
- **Severidad**: Baja - no afecta funcionalidad ni experiencia del usuario
- **Contexto**: Implementado guard `isMounted && pathname === item.href` pero error residual sugiere renderización asincrónica adicional o timing issue
- **Acción**: Evaluar en próximo sprint si es necesario refactor más profundo (posible: usar `suppressHydrationWarning` temporal o repensar estructura de NavLink)

## Notas para el agente

**Acción manual prerequisito — debe hacerse antes de escribir una línea de código:**
En el dashboard de Supabase → Database → Realtime, habilitar el toggle para la tabla `orders`. Sin este paso, la suscripción Realtime no recibe eventos aunque el código sea correcto.

**Por qué `useEffect` con array vacío y no con `ordersData` como dependencia:**
`ordersData` se inicializa desde el prop `orders` de SSR, que siempre tiene datos en el primer render porque la page los fetchea server-side. Usar `ordersData` como dependencia montaría y desmonaría el canal en cada actualización de la lista, lo que generaría múltiples canales activos simultáneos.

**Por qué no usar el payload de Realtime directamente:**
El evento `INSERT` de Supabase Realtime devuelve solo la fila base de `orders`. No incluye los joins con `order_items` (con `products` anidados) ni `payments`. El tipo `OrderWithItems` requiere esos joins. Llamar a `refreshOrders()` garantiza que el pedido nuevo se integra con la misma forma de datos que el resto de la lista.

**Supabase client disponible:**
`supabase` ya está instanciado en el componente via `getBrowserClient()` en la línea existente. No crear una nueva instancia.

## Al terminar
- Verificar el criterio de done completo
- Commit en rama `feature/realtime-orders` con mensaje `feat: reemplazar polling por Supabase Realtime en panel de pedidos`
- Actualizar CONTEXT.md: qué se hizo, decisiones tomadas durante implementación, y que el próximo task es `auto-print-orders.md` (requiere este task completo como base)
