# tasks/qztray-onboarding.md

## Objetivo

Los owners tienen acceso a instrucciones claras de instalación de QZ Tray en tres lugares: al completar el onboarding por primera vez, en el aviso del panel de pedidos cuando QZ Tray no está disponible, y en una nueva pestaña de configuración en `/admin/settings`.

## Scope estricto

**Incluye:**
- Crear página `/onboarding/complete` con mensaje de bienvenida, componente de instrucciones QZ Tray y botón "Ir al panel"
- Modificar `StoreOnboardingForm` para redirigir a `/onboarding/complete` en lugar de `/admin` al completar
- Crear componente reutilizable `QzTrayInstructions` con link a descarga oficial y pasos en español
- Integrar `QzTrayInstructions` en el aviso de QZ Tray no disponible del panel de pedidos (punto de integración ya scaffoldeado en `auto-print-orders.md`)
- Agregar tab "Impresión" en `store-settings-form.tsx` con toggle de impresión automática y `QzTrayInstructions`

**No incluye:**
- Cambios en la lógica ni en los campos del formulario de onboarding
- Detección de si QZ Tray está instalado fuera del panel de pedidos
- Tutorial en video ni capturas de pantalla
- Alojar el instalador en Supabase Storage (post-MVP)
- Cambios en el middleware de autenticación para proteger `/onboarding/complete`

**Depende de:**
- `auto-print-orders.md` completo y en verde. Este task integra `QzTrayInstructions` en el aviso que ese task define. El punto de integración en `orders-table.tsx` debe estar presente antes de ejecutar este task.

## Componente QzTrayInstructions

```typescript
// components/admin/qztray-instructions.tsx
// Componente de solo presentación. Sin props requeridas. Sin lógica de negocio.
// Reutilizable en onboarding, panel de pedidos y settings.

export function QzTrayInstructions() {
  // Renderiza:
  // 1. Título: "Configurar impresión automática"
  // 2. Párrafo breve: qué es QZ Tray y por qué FoodyNow lo necesita para
  //    imprimir tickets automáticamente sin intervención del usuario
  // 3. Lista de pasos numerados en español:
  //    Paso 1: Descargar QZ Tray desde el botón de descarga
  //    Paso 2: Ejecutar el instalador descargado (no requiere instalar Java por separado)
  //    Paso 3: Una vez instalado, abrir QZ Tray desde el menú de inicio
  //    Paso 4: En el ícono de la bandeja del sistema, activar "Automatically Start"
  //            para que arranque automáticamente con Windows
  //    Paso 5: Volver al panel de pedidos — la impresión automática estará activa
  // 4. Nota sobre el diálogo de confianza:
  //    "La primera vez que uses la impresión automática, el navegador puede mostrar
  //     un aviso de seguridad de QZ Tray. Hacé clic en 'Permitir' o 'Confiar'
  //     para habilitarlo."
  // 5. Botón/link de descarga: texto "Descargar QZ Tray", href "https://qz.io/download/",
  //    target="_blank", rel="noopener noreferrer"
}
```

## UI — /onboarding/complete

```typescript
// app/onboarding/complete/page.tsx
// Página que se muestra inmediatamente después de completar el onboarding.
// El middleware existente ya protege /onboarding/* para owners autenticados.

// Estructura de la página:
// - Ícono o visual de éxito (usar lucide-react, ej: CheckCircle)
// - Título: "¡Tu tienda está lista!"
// - Subtítulo: "Ya podés empezar a recibir pedidos."
// - Separador visual
// - Sección destacada con <QzTrayInstructions />
// - Botón primario: "Ir al panel de pedidos" → href="/admin"
//   (usar Link de next/link, no router.push — no requiere JS para navegar)
```

## UI — /admin/settings (tab Impresión)

Agregar un nuevo `TabsTrigger` y su correspondiente `TabsContent` en `store-settings-form.tsx`, siguiendo exactamente el mismo patrón que los tabs existentes (`store`, `extended`, `hours`, `payments`).

```typescript
// Nuevo TabsTrigger — agregar en TabsList junto a los existentes:
<TabsTrigger value="printing">Impresión</TabsTrigger>

// Nuevo TabsContent:
<TabsContent value="printing">
  // Contenido:
  // 1. Toggle de impresión automática
  //    - Usar Switch de shadcn/ui (ya disponible en el proyecto)
  //    - Label: "Impresión automática de tickets"
  //    - Descripción corta: "Imprime automáticamente cada nuevo pedido
  //      cuando QZ Tray está corriendo en esta computadora."
  //    - Estado controlado por localStorage key 'orders_auto_print_enabled'
  //      (mismo key que en orders-table.tsx — comparten estado por diseño)
  //    - Inicializar: localStorage.getItem('orders_auto_print_enabled') !== 'false'
  //    - Al cambiar: localStorage.setItem('orders_auto_print_enabled', String(value))
  //    - Este es un componente "use client" por el acceso a localStorage
  // 2. <QzTrayInstructions /> debajo del toggle
</TabsContent>
```

## UI — Panel de pedidos (integración)

En `orders-table.tsx`, el aviso de QZ Tray no disponible definido en `auto-print-orders.md` debe expandirse para incluir `QzTrayInstructions`:

```typescript
// Reemplazar el texto plano del aviso por:
// - Texto rojo: "Impresión automática deshabilitada: QZ Tray no está disponible."
// - <QzTrayInstructions /> debajo del texto, colapsable o directamente visible
//   (decisión de implementación del agente — lo que quede más limpio visualmente)
```

## Archivos a crear o modificar

```
Crear:
  app/onboarding/complete/page.tsx
    — Página post-onboarding con bienvenida e instrucciones de QZ Tray

  components/admin/qztray-instructions.tsx
    — Componente reutilizable de instrucciones de instalación

Modificar:
  components/admin/store-onboarding-form.tsx
    — Cambiar la redirección final de router.push('/admin')
      a router.push('/onboarding/complete')
    — Buscar el punto exacto donde ocurre la redirección post-submit
      (probablemente en el handler de éxito del form, después de marcar is_onboarded: true)
    — Solo cambiar la URL destino, sin ningún otro cambio

  components/admin/store-settings-form.tsx
    — Agregar TabsTrigger value="printing" en el TabsList existente
    — Agregar TabsContent value="printing" con toggle y QzTrayInstructions
    — El componente puede necesitar "use client" si no lo tiene ya
      (por el acceso a localStorage del toggle)

  components/admin/orders-table.tsx
    — Integrar <QzTrayInstructions /> en el aviso de QZ Tray no disponible
      scaffoldeado en auto-print-orders.md

No tocar:
  app/onboarding/page.tsx — sin cambios
  components/ui/tabs.tsx — sin cambios
  La lógica del formulario de onboarding (campos, validaciones, submit) — sin cambios
```

## Restricciones específicas de esta unidad

- `QzTrayInstructions` es un Server Component por defecto — no usa hooks ni estado. No agregar `"use client"` a menos que sea estrictamente necesario.
- El tab "Impresión" en settings sí necesita `"use client"` por el acceso a localStorage. Si `store-settings-form.tsx` ya es un Client Component, no hay cambio. Si no lo es, extraer solo el contenido del tab a un componente client separado (`PrintingTabContent` o similar) para no forzar todo el form a ser client.
- El localStorage key del toggle debe ser exactamente `'orders_auto_print_enabled'` — el mismo que usa `orders-table.tsx`. No crear un key nuevo ni duplicar la lógica.
- La redirección en `store-onboarding-form.tsx` es el único cambio en ese archivo. No tocar campos, validaciones ni lógica de submit.
- No agregar lógica de detección de QZ Tray en ninguno de los archivos nuevos de este task. Esa lógica vive exclusivamente en `useQzTray` definido en `auto-print-orders.md`.

## Criterio de done

### Quality gate
- [ ] `pnpm build` sin errores
- [ ] `tsc --noEmit` sin errores de tipos
- [ ] `QzTrayInstructions` no importa hooks de React ni APIs de browser (es Server Component)

### Smoke test
- [ ] Completar el formulario de onboarding → redirige a `/onboarding/complete` en lugar de `/admin`
- [ ] `/onboarding/complete` muestra el mensaje de bienvenida, las instrucciones y el botón funcional
- [ ] El botón "Ir al panel de pedidos" en `/onboarding/complete` lleva a `/admin`
- [ ] El link de descarga en `QzTrayInstructions` abre `https://qz.io/download/` en pestaña nueva
- [ ] En `/admin/settings` existe el tab "Impresión" visible junto a los tabs existentes
- [ ] El toggle en el tab "Impresión" cambia estado y persiste al recargar la página
- [ ] El toggle en `/admin/settings` y el toggle en el panel de pedidos reflejan el mismo estado (mismo localStorage key)
- [ ] En el panel de pedidos con QZ Tray no disponible, el aviso incluye las instrucciones de instalación

## Notas para el agente

**Sobre la redirección en store-onboarding-form.tsx:**
Buscar el único lugar donde ocurre `router.push('/admin')` o `redirect('/admin')` dentro del flujo de éxito del submit. Cambiar solo esa URL. Si hay más de una redirección a `/admin` en el archivo, cambiar únicamente la que ocurre después de marcar `is_onboarded: true`.

**Sobre el tab en settings y "use client":**
Verificar si `store-settings-form.tsx` ya tiene `"use client"` en la primera línea. Si lo tiene, agregar el toggle directamente en el TabsContent. Si no lo tiene, crear un componente separado `PrintingTabContent` con `"use client"` que contenga el toggle, y renderizarlo dentro del TabsContent para no contaminar el resto del form.

**Sobre la visibilidad de QzTrayInstructions en el panel de pedidos:**
El aviso de QZ Tray no disponible puede volverse visualmente largo al incluir las instrucciones completas. El agente puede optar por mostrar las instrucciones en un Collapsible de shadcn/ui (ya disponible en el proyecto) con texto "Ver instrucciones de instalación". Esta es una decisión de implementación delegada al agente.

**Sobre /onboarding/complete y el middleware:**
El middleware actual (`proxy.ts`) protege rutas de `/admin` y redirige a `/auth/login` si no hay sesión. Verificar si `/onboarding` está en la lista de rutas protegidas o públicas. Si `/onboarding/complete` no queda protegida automáticamente, agregar la ruta al patrón correspondiente en `proxy.ts`. No asumir — revisar el middleware antes de asumir que la protección es automática.

## Al terminar
- Verificar el criterio de done completo
- Commit en rama `feature/qztray-onboarding` con mensaje `feat: instrucciones de instalación QZ Tray en onboarding, settings y panel de pedidos`
- Actualizar CONTEXT.md: qué se hizo, decisiones de implementación tomadas (especialmente sobre Client vs Server Components en settings), estado final de los tres puntos de acceso a QzTrayInstructions
