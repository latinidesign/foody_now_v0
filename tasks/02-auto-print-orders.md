# tasks/auto-print-orders.md

## Objetivo

Cuando llega un pedido nuevo y el owner tiene el panel de pedidos abierto, el ticket se imprime automáticamente sin intervención del usuario via QZ Tray. La feature es activable/desactivable por dispositivo desde el mismo panel. Si QZ Tray no está corriendo, se muestra un aviso no invasivo sobre la lista de pedidos.

## Scope estricto

**Incluye:**
- Migración: agregar columna `auto_printed_at` (timestamp nullable) en la tabla `orders`
- Instalar dependencia `qz-tray` (npm) — aprobada explícitamente
- Crear hook `useQzTray` que encapsula conexión, detección de disponibilidad y envío del comando de impresión
- Lógica de detección de pedidos a imprimir: `auto_printed_at` is null **Y** `created_at` > timestamp de montaje del componente
- Timestamp de montaje guardado en localStorage, sobreescrito en cada visita a la página
- Toggle activado/desactivado persistido en localStorage por dispositivo, activado por defecto
- Aviso no invasivo (texto rojo) sobre la lista cuando la feature está activa pero QZ Tray no está disponible; oculto cuando el toggle está desactivado
- Agregar `auto_printed_at` al select en `app/admin/orders/page.tsx` y en `app/api/admin/orders/route.ts`
- Agregar `auto_printed_at` al tipo `OrderWithItems` en `orders-table.tsx`
- Marcar `auto_printed_at` en Supabase después de imprimir cada pedido
- Actualizar ARCHITECTURE.md con QZ Tray como integración externa

**No incluye:**
- Cambios en `handlePrintTicket` (impresión manual existente, sin modificaciones)
- Cambios en `buildTicketHtml` (se reutiliza tal cual)
- UI de configuración de QZ Tray ni onboarding guiado al owner
- Desactivación global por cuenta ni por tienda
- Configuración del nombre de la impresora (usa la predeterminada del sistema)

**Depende de:**
- `realtime-orders.md` completo y en verde. Este task asume que el polling fue reemplazado por Supabase Realtime y que `refreshOrders()` se dispara por eventos de la suscripción.

## Migración de base de datos

```sql
-- Agregar columna auto_printed_at a la tabla orders
-- Nullable: los pedidos existentes quedan en NULL sin problema,
-- la lógica de impresión siempre compara también contra el timestamp de montaje
ALTER TABLE orders ADD COLUMN auto_printed_at TIMESTAMPTZ NULL;
```

Ejecutar en el dashboard de Supabase (SQL Editor) antes de deployar el código.

## Hook useQzTray

```typescript
// hooks/use-qz-tray.ts
// Encapsula la conexión con QZ Tray, detección de disponibilidad y envío de impresión.
// QZ Tray debe estar instalado y corriendo en la máquina del owner.
// Usa siempre la impresora predeterminada del sistema.

interface UseQzTrayReturn {
  isAvailable: boolean  // true si QZ Tray está corriendo y conectado
  print: (html: string) => Promise<void>  // envía HTML a la impresora predeterminada
}

export function useQzTray(): UseQzTrayReturn {
  // Estado: isAvailable inicializa en false hasta confirmar conexión
  // Al montar:
  //   1. Importar qz-tray dinámicamente (es una lib de cliente puro)
  //   2. Llamar qz.websocket.connect()
  //   3. Si conecta: setIsAvailable(true)
  //   4. Si falla: setIsAvailable(false), loggear error en consola (no throw)
  // Al desmontar:
  //   - Si la conexión está activa: qz.websocket.disconnect()
  // print(html):
  //   - Obtener impresora predeterminada: qz.printers.getDefault()
  //   - Crear config: qz.configs.create(printerName)
  //   - Crear print data de tipo 'pixel', format 'html', con el html recibido
  //   - Llamar qz.print(config, [printData])
  //   - Si falla: throw error (el caller decide cómo manejarlo)
}
```

## Lógica de negocio en OrdersTable

### Keys de localStorage

```typescript
// Constantes a nivel módulo, fuera del componente
const MOUNTED_AT_KEY = 'orders_panel_mounted_at'
const AUTO_PRINT_ENABLED_KEY = 'orders_auto_print_enabled'
```

### Al montar el componente

```typescript
// useEffect de inicialización — sobreescribir timestamp de montaje en cada visita
// Esto garantiza que pedidos anteriores a esta sesión nunca se impriman
useEffect(() => {
  localStorage.setItem(MOUNTED_AT_KEY, new Date().toISOString())
}, [])
```

### Toggle

```typescript
// Estado inicial: leer desde localStorage, default true si no existe
const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(
  () => localStorage.getItem(AUTO_PRINT_ENABLED_KEY) !== 'false'
)

// Al cambiar el toggle:
const handleAutoPrintToggle = (enabled: boolean) => {
  setAutoPrintEnabled(enabled)
  localStorage.setItem(AUTO_PRINT_ENABLED_KEY, String(enabled))
}
```

### Detección y disparo — dentro de refreshOrders(), después de setOrdersData()

```typescript
// Agregar al bloque if (Array.isArray(data.orders)) de refreshOrders(),
// inmediatamente después de setOrdersData(data.orders)

const mountedAt = localStorage.getItem(MOUNTED_AT_KEY)

if (autoPrintEnabled && mountedAt && isQzAvailable) {
  const mountedAtDate = new Date(mountedAt)

  const candidates = data.orders.filter((order: OrderWithItems) =>
    order.auto_printed_at === null &&
    new Date(order.created_at) > mountedAtDate
  )

  for (const order of candidates) {
    try {
      // Reutilizar buildTicketHtml existente sin modificaciones
      const html = buildTicketHtml(order)
      await qzPrint(html)  // función print expuesta por useQzTray

      // Marcar como impreso en Supabase
      await markOrderAsPrinted(order.id)
    } catch (error) {
      // No interrumpir el loop si falla un pedido individual
      console.error(`Error auto-printing order ${order.id}:`, error)
    }
  }
}
```

### Función markOrderAsPrinted

```typescript
// Función interna del componente
// Actualiza auto_printed_at en Supabase para el pedido dado
const markOrderAsPrinted = async (orderId: string): Promise<void> => {
  const { error } = await supabase
    .from('orders')
    .update({ auto_printed_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    // Loggear pero no throw: si falla el marcado, en el peor caso
    // el pedido se vuelve a imprimir en el próximo refresh,
    // pero el timestamp de montaje lo protege de reimprimir en recargas futuras
    console.error(`Error marking order ${orderId} as printed:`, error)
  }
}
```

## Queries y lecturas

Agregar `auto_printed_at` al select en dos archivos independientes:

**`app/admin/orders/page.tsx`** — query SSR:
Localizar el `.select(...)` sobre la tabla `orders` y agregar `auto_printed_at` al listado de columnas.

**`app/api/admin/orders/route.ts`** — route handler:
Localizar el `.select(...)` sobre la tabla `orders` y agregar `auto_printed_at` al listado de columnas.

## Tipo OrderWithItems

```typescript
// Agregar campo al interface OrderWithItems en orders-table.tsx
interface OrderWithItems extends Order {
  auto_printed_at: string | null  // timestamp ISO o null si no fue impreso aún
  order_items: Array<{
    // ... sin cambios
  }>
  payments: Array<{
    // ... sin cambios
  }>
}
```

## UI

**Toggle** — agregar en el header del componente, junto a los filtros existentes:
- Componente: usar el Switch de shadcn/ui ya disponible en el proyecto
- Label visible: "Impresión automática"
- Estado controlado por `autoPrintEnabled`
- Sin confirmación al cambiar

**Aviso de QZ Tray no disponible** — agregar entre los filtros y la lista de pedidos:
- Visible solo cuando: `autoPrintEnabled === true` **Y** `isQzAvailable === false`
- Texto: "Impresión automática deshabilitada: QZ Tray no está disponible. Verificá que la aplicación esté instalada y corriendo."
- Estilo: texto pequeño en color rojo destructivo, no invasivo, sin bloquear la UI

## Archivos a crear o modificar

```
Crear:
  hooks/use-qz-tray.ts
    — Hook que encapsula conexión, isAvailable y print() via QZ Tray

Modificar:
  components/admin/orders-table.tsx
    — Agregar interface field auto_printed_at a OrderWithItems
    — Agregar constantes MOUNTED_AT_KEY y AUTO_PRINT_ENABLED_KEY a nivel módulo
    — Agregar useEffect de inicialización del timestamp de montaje
    — Agregar estado autoPrintEnabled con inicialización desde localStorage
    — Agregar handleAutoPrintToggle
    — Integrar useQzTray (isAvailable, print)
    — Agregar lógica de detección y disparo en refreshOrders()
    — Agregar markOrderAsPrinted()
    — Agregar toggle en UI (header, junto a filtros)
    — Agregar aviso de QZ Tray no disponible (entre filtros y lista)

  app/admin/orders/page.tsx
    — Agregar auto_printed_at al select de la query SSR

  app/api/admin/orders/route.ts
    — Agregar auto_printed_at al select de la route handler

  ARCHITECTURE.md
    — Agregar QZ Tray en sección de integraciones externas:
      "QZ Tray: aplicación de escritorio instalada en la máquina del owner.
       Permite enviar comandos de impresión desde el browser directamente
       a la impresora del sistema sin diálogo de confirmación.
       Integrada via paquete npm qz-tray. Requerida para auto-impresión de tickets."

No tocar:
  handlePrintTicket — impresión manual, sin cambios
  buildTicketHtml — se reutiliza sin modificaciones
```

## Restricciones específicas de esta unidad

- No modificar `handlePrintTicket` ni `buildTicketHtml` bajo ninguna circunstancia.
- `useQzTray` debe importar `qz-tray` dinámicamente o con `"use client"` explícito — es una librería que accede a APIs del browser y no puede ejecutarse en el servidor.
- El loop de `candidates` debe ser secuencial (`for...of` con `await`), no paralelo (`Promise.all`), para evitar condiciones de carrera al marcar pedidos en Supabase.
- Si `markOrderAsPrinted` falla, no interrumpir el loop ni mostrar error al usuario — solo loggear en consola.
- El timestamp `orders_panel_mounted_at` debe sobreescribirse en cada montaje del componente sin excepción. Es el mecanismo de seguridad contra reimprimir pedidos históricos.

## Criterio de done

### Quality gate
- [ ] `pnpm build` sin errores
- [ ] `tsc --noEmit` sin errores de tipos
- [ ] Sin errores en consola al montar con QZ Tray corriendo
- [ ] Sin errores en consola al montar sin QZ Tray corriendo (fallo de conexión loggeado, no thrown)

### Smoke test
- [ ] Con QZ Tray corriendo y toggle activo: crear pedido de prueba (pago en efectivo) → ticket se imprime solo en menos de 5 segundos sin intervención del usuario
- [ ] Con QZ Tray corriendo y toggle activo: recargar página → los pedidos existentes no se reimprimen
- [ ] Con QZ Tray detenido y toggle activo: aviso rojo visible sobre la lista de pedidos
- [ ] Con QZ Tray detenido y toggle desactivado: aviso rojo no visible
- [ ] Desactivar toggle → recargar página → toggle sigue desactivado (persiste en localStorage)
- [ ] Activar toggle → recargar página → toggle sigue activado (persiste en localStorage)
- [ ] Verificar en Supabase que `auto_printed_at` se actualiza correctamente después de imprimir

## Notas para el agente

**Acción manual prerequisito — ejecutar antes de escribir código:**
Correr la migración SQL en el dashboard de Supabase (SQL Editor). Sin este paso el campo `auto_printed_at` no existe y el código falla en runtime.

**Instalación de QZ Tray para testing:**
Descargar QZ Tray 2.2 o superior desde https://qz.io/download/ — esta versión incluye Java bundleado, no requiere instalar JRE por separado. Configurar "Automatically Start" desde el ícono en la bandeja del sistema para que arranque con Windows.

**Por qué localStorage para el toggle y el timestamp:**
Ambos son estado de dispositivo, no de cuenta. El toggle refleja la preferencia del operador físico en esa máquina. El timestamp es un guardrail de sesión. Ninguno de los dos debe sincronizarse entre dispositivos ni persistir en Supabase.

**Edge case de markOrderAsPrinted fallando:**
Si el update en Supabase falla, `auto_printed_at` queda en null. En el próximo refresh, el pedido vuelve a ser candidato. Sin embargo, el timestamp de montaje (`orders_panel_mounted_at`) lo protege de reimprimir en sesiones futuras, ya que fue creado antes del montaje actual. En la sesión actual sí podría reimprimir — es un trade-off aceptado para el MVP.

**QZ Tray y certificados:**
En desarrollo local QZ Tray puede mostrar un diálogo de confianza la primera vez que el browser se conecta. El owner debe aceptarlo. En producción con HTTPS puede requerir configuración adicional de certificados en QZ Tray — documentar esto para el equipo de soporte si surge durante el onboarding del primer cliente.

## Al terminar
- Verificar el criterio de done completo
- Commit en rama `feature/auto-print-orders` con mensaje `feat: auto-impresión de tickets via QZ Tray al recibir pedidos nuevos`
- Actualizar CONTEXT.md: qué se hizo, decisiones tomadas durante implementación, estado del campo auto_printed_at en pedidos históricos (null, sin impacto funcional)
