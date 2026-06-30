# UX Mobile — Admin & Store: Ajustes y correcciones

**Fecha:** 2026-06-30  
**Branch:** main

---

## Resumen

Sesión de ajustes de UX mobile/desktop en el panel de administración y el store público. Se corrigió un bug crítico en analíticas, se eliminó el límite de productos en el listado admin, y se rediseñaron las cards de productos y pedidos siguiendo el estilo visual del store.

---

## Cambios por archivo

### `app/admin/analytics/page.tsx`
**Bug: el selector de fechas no tenía efecto**

- `searchParams` tipado como `Promise<SearchParams>` y awaiteado correctamente (Next.js 15+ requiere await en page components)
- `endDate` ajustado al final del día (`23:59:59.999`) para incluir pedidos del último día del período seleccionado
- Sin estos cambios, la selección de período (Hoy / 7 días / Mes / Trimestre) siempre mostraba el mes actual

---

### `app/admin/products/page.tsx`
**Bug: límite de 20 productos en el listado**

- Eliminado `.limit(20)` de la query a Supabase
- Ahora se cargan todos los productos de la tienda (probado con tienda de 102 productos)

---

### `components/admin/products-table.tsx`
**Rediseño UX mobile + paginación**

- Cards rediseñadas: `rounded-2xl shadow-sm` sin bordes, igual estilo al store
- Imagen siempre visible (`w-20 h-20 rounded-xl`), con placeholder si no hay imagen
- Layout compacto: nombre + badge en fila superior, categoría debajo, precio y acciones en fila inferior
- Badge abreviado ("Activo" / "Inactivo") para no cortar en mobile
- Botones de acción: `h-8 w-8 p-0` — íconos solos, más compactos
- `space-y-2` entre items (antes `space-y-4`)
- Búsqueda opera sobre **todos** los productos (no solo los 20 cargados)
- Paginación: 20 items por página, controles de navegación, reset al buscar

---

### `components/admin/orders-table.tsx`
**Rediseño UX mobile + reorganización de filtros**

**Filtros:**
- Búsqueda: ancho completo
- Estado + Entrega: `grid grid-cols-2` en lugar de `flex wrap`
- Selector de fechas: fila propia
- Auto-impresión + Refrescar + Limpiar: fila compacta con `ml-auto`
- Contador: texto `xs` al pie del bloque de filtros

**Cards de pedidos:**
- `rounded-2xl shadow-sm` sin border — consistente con estilo del store
- Fila 1: número + badge estado + badge tipo + total alineado a la derecha
- Fila 2: cliente y fecha en grid de 2 columnas (sin superposición en mobile)
- Fila 3: los tres controles (select estado + imprimir + ver) alineados a la derecha con `justify-end`
- Select de estado: `w-[180px]` mobile / `w-[220px]` desktop — sin expandirse al ancho completo
- `space-y-2` entre cards (antes `space-y-4`)

---

### `components/admin/subscription-status.tsx`
**Bloques de aviso de estado — layout mobile**

Bloques de `expired`, `cancelled`, `suspended`, `past_due`:
- Contenedor cambiado a `flex flex-col gap-3`
- Texto (título + descripción) en bloque superior
- Botón en bloque inferior, ancho completo (`block w-full`)
- `<Link>` con `block` para garantizar comportamiento de bloque en mobile

---

### `components/admin/trial-alert.tsx`
**Banner de trial — layout mobile**

- Fila superior: ícono + texto (título + descripción) | botón ✕
- Fila inferior: botón "Suscribite ahora" ancho completo (`w-full`, `justify-center`)
- El botón ya no comprime el texto en mobile

---

### `components/store/store-hours-banner.tsx`
**Mensaje de tienda cerrada**

- Texto dividido en dos líneas: primera línea "La tienda está cerrada en este momento.", segunda línea con el horario de apertura en **negrita**
- `text-center` para centrar ambas líneas
- Mobile: `mx-3.5` (ancho normal)
- Desktop: `md:w-[400px] md:mx-auto` — 400px centrado horizontalmente

---

## Archivos modificados

| Archivo | Tipo de cambio |
|---|---|
| `app/admin/analytics/page.tsx` | Bug fix crítico |
| `app/admin/products/page.tsx` | Bug fix |
| `components/admin/products-table.tsx` | Rediseño UX + paginación |
| `components/admin/orders-table.tsx` | Rediseño UX mobile |
| `components/admin/subscription-status.tsx` | Fix layout mobile |
| `components/admin/trial-alert.tsx` | Fix layout mobile |
| `components/store/store-hours-banner.tsx` | Mejora visual |
