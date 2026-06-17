# tasks/05-pricing-absolute-varieties.md

## Objetivo

Cambiar la semantica del campo `price_modifier` de `product_option_values` para que represente el **precio absoluto de la variedad** en lugar del **delta sobre el precio base del producto**. Esto resuelve dos problemas acoplados.

El primer problema es la friccion cognitiva del vendedor al cargar opciones. Hoy debe calcular el diferencial mentalmente (ej: base $18999, variedad $19798, diferencia $798 poco legible), en Argentina el usuario espera ver el precio completo de la variedad, no el diferencial.

El segundo problema es el caso especifico de productos en modo "usar precio base" con opciones tipo "por cantidad". Hoy el precio final se calcula como `basePrice * cantidadProducto + Î£(qty Ã— delta)`, lo que es incorrecto para la intencion del dueÃ±o (vender un combo armado por variedades a precio completo cada una).

Ademas, en este task se corrige un bug latente: el `total` mostrado al comprador en el checkout puede no coincidir con el total cobrado por MercadoPago por un problema de redondeo de `unit_price`.

## Scope estricto

### Incluye

- Modificar la logica de `lib/utils/pricing.ts` para que las opciones se calculen con precios absolutos.
- Modificar la UI del producto en la tienda para reflejar el nuevo modelo.
- Modificar el formulario de opciones en el admin para cargar precios absolutos.
- Modificar la API de creacion de ordenes y la API de creacion de preferencia de MercadoPago para usar el nuevo calculo.
- Modificar el ticket impreso y el modal de detalle de orden en el admin para mostrar precios coherentes.
- Script de migracion SQL que convierte los `price_modifier` existentes de delta a absoluto, sumando `product.price` correspondiente.
- Banner de unica vez en el admin que avisa a cada tienda del cambio de precios y le pide confirmacion (boton cerrar con acknowledgement persistido).
- Fix del bug de redondeo: forzar `total_price = unit_price * quantity` para garantizar consistencia entre lo que ve el comprador, lo que cobra MP y lo que se persiste en `order_items`.
- Logs de consola del navegador con el breakdown completo del calculo, para diagnosticar visualmente cualquier inconsistencia.

### No incluye

- Renombrar la columna SQL `price_modifier` ni los campos en TypeScript. Solo se documenta el cambio de significado.
- Refactor de codigo legacy, dead code o `pricingConfigOverride` que esta como parametro inutilizado.
- Cambios en la validacion de `is_required` que no bloquea el boton "Agregar al Pedido".
- Arreglo de la inconsistencia entre `checkout-form.tsx:322` y `state.total` mas alla de lo necesario para el fix de redondeo.
- Arreglo del `useEffect` con dependencias potencialmente loops en `product-options.tsx:108-166`.
- Migracion de la pagina de demo `app/demo/page.tsx` (queda con datos mock desactualizados, fuera de scope).
- Tests automatizados (no hay framework de tests en el proyecto, ver seccion Pendientes arquitectonicos del ARCHITECTURE.md).

### Depende de

- Ninguna dependencia de codigo previa. Requiere una corrida manual del script SQL de migracion en Supabase (ver seccion Migracion de datos para el agente).

## LÃƒÂ³gica de negocio

### Reglas de calculo (regla general, todo producto y toda opcion)

`price_modifier` es ahora el **precio completo de la variedad**. No se suma con el `product.price`. Las reglas de combinacion dependen del modo de pricing del producto y del tipo de opcion.

```typescript
// lib/utils/pricing.ts Ã¢â‚¬â€ nueva firma de calculateSelectedOptionsPrice
// Devuelve un breakdown explicito en vez de un numero opaco,
// para que el caller pueda renderizarlo y para los console.log.

type OptionBreakdownItem =
  | {
      type: "variety_single"
      optionId: string
      valueId: string
      name: string
      unitPrice: number   // = price_modifier de la variedad, ya absoluto
      subtotal: number    // = unitPrice (single: una sola unidad)
    }
  | {
      type: "variety_multiple"
      optionId: string
      valueId: string
      name: string
      unitPrice: number
      subtotal: number    // = unitPrice (se cuenta una vez por seleccion)
    }
  | {
      type: "variety_quantity"
      optionId: string
      valueId: string
      name: string
      unitPrice: number
      quantity: number    // cantidad elegida por el usuario
      subtotal: number    // = unitPrice * quantity
    }

type OptionsBreakdown = {
  items: OptionBreakdownItem[]
  total: number         // = sum(items.subtotal)
}

function calculateSelectedOptionsPrice(
  product: ProductWithOptions,
  selectedOptions: Record<string, unknown> | null | undefined,
): OptionsBreakdown
```

### Reglas de combinacion con `product.price` (responsabilidad del caller)

```typescript
// Pseudo-codigo de la decision del caller
function computeItemTotal(product, pricingQuantity, selectedOptions) {
  const optionsBreakdown = calculateSelectedOptionsPrice(product, selectedOptions)
  const hasOptionsSelected = optionsBreakdown.items.length > 0
  const isPricingProduct = product.pricing_config != null

  // Caso A: producto con pricing_config (packs/empanadas).
  // El pricing_config manda, las opciones se IGNORAN para el precio.
  // (Comportamiento actual, sin cambios.)
  if (isPricingProduct) {
    const pricing = calculateProductPrice({ product, quantity: pricingQuantity })
    return {
      total: pricing.total,
      breakdown: pricing.breakdown,
      optionsBreakdown: { items: [], total: 0 },
    }
  }

  // Caso B: producto sin pricing_config + hay opciones por cantidad elegidas.
  // El total es la sumatoria de los subtotales de las variedades.
  // product.price NO participa.
  const hasQuantityOptionSelected = optionsBreakdown.items.some(
    (i) => i.type === "variety_quantity"
  )
  if (hasQuantityOptionSelected) {
    return {
      total: optionsBreakdown.total,
      breakdown: [],
      optionsBreakdown,
    }
  }

  // Caso C: producto sin pricing_config + opciones single/multiple elegidas.
  // Si hay una opcion single-type seleccionada, su precio REEMPLAZA al base
  // (no se suma). Si no hay single pero si multiple, se suman al base.
  // Si no hay nada seleccionado, se usa el base (Caso D).
  if (hasOptionsSelected) {
    const basePrice = product.sale_price ?? product.price
    const singleItems = optionsBreakdown.items.filter(
      (i) => i.type === "variety_single"
    )
    const multipleItems = optionsBreakdown.items.filter(
      (i) => i.type === "variety_multiple"
    )
    const singleSum = singleItems.reduce((sum, i) => sum + i.unitPrice, 0)
    const multipleSum = multipleItems.reduce((sum, i) => sum + i.unitPrice, 0)
    const baseForTotal = singleItems.length > 0 ? 0 : basePrice
    const perItemTotal = baseForTotal + singleSum + multipleSum
    return {
      total: perItemTotal * pricingQuantity,
      breakdown: [
        ...(singleItems.length > 0
          ? singleItems.map((i) => ({
              type: "option" as const,
              name: i.name,
              unitPrice: i.unitPrice,
              subtotal: i.unitPrice,
            }))
          : [{ type: "base" as const, quantity: 1, unitPrice: basePrice, total: basePrice }]),
        ...multipleItems.map((i) => ({
          type: "option" as const,
          name: i.name,
          unitPrice: i.unitPrice,
          subtotal: i.unitPrice,
        })),
      ],
      optionsBreakdown,
    }
  }

  // Caso D: producto sin pricing_config + sin opciones elegidas (o sin opciones).
  // Comportamiento clasico: product.price * quantity.
  const basePrice = product.sale_price ?? product.price
  return {
    total: basePrice * pricingQuantity,
    breakdown: [
      { type: "unit", quantity: pricingQuantity, unitPrice: basePrice, total: basePrice * pricingQuantity },
    ],
    optionsBreakdown: { items: [], total: 0 },
  }
}
```

### Reglas del caller para el carrito

```typescript
// En product-detail.tsx, despues de calcular el total:
const itemTotal = computeItemTotal(product, pricingQuantity, selectedOptions)

// Contador del producto:
// - Caso A: pricingQuantity lo define el pricing_config (puede ser packSize*counter o selectedOptionsQuantity).
// - Caso B: pricingQuantity = sum(quantity) de las variedades quantity-type elegidas.
// - Caso C/D: pricingQuantity = contador del Plus/Minus (1 por default).

// IMPORTANTE: cuando Caso B, el contador Plus/Minus del panel inferior se OCULTA.
// La cantidad que va al carrito se deriva del breakdown de variedades.

const approximateUnitPrice = itemTotal.total > 0
  ? Math.ceil(itemTotal.total / pricingQuantity)
  : 0

// FIX DE REDONDEO: forzar consistencia entre unit_price y total_price
// para que el total cobrado por MP coincida exactamente con lo que ve el cliente.
// SIEMPRE se redondea al ALZA con Math.ceil, beneficiando al vendedor
// en cualquier diferencia de precision. El cliente ve el mismo numero
// entero que cobra MP.
const finalTotal = approximateUnitPrice * pricingQuantity
const finalUnitPrice = approximateUnitPrice

addItem({
  id: variantId,
  product_id: product.id,
  name: product.name,
  price: finalUnitPrice,
  total_price: finalTotal,
  quantity: pricingQuantity,
  selectedOptions,
  pricing_snapshot: {
    config: product.pricing_config ?? null,
    breakdown: itemTotal.breakdown,
    options_breakdown: itemTotal.optionsBreakdown,
  },
})
```

### Reglas del caller para la API (orders y create-preference)

```typescript
// Misma logica de computeItemTotal. El servidor recalcula desde selectedOptions
// y desde el product leido de la DB. Aplica el mismo fix de redondeo:
//   finalUnitPrice = Math.ceil(exactTotal / quantity)   <-- siempre al alza
//   finalTotal = finalUnitPrice * quantity   <-- forzar consistencia
```

### Reglas del fix de redondeo (clave del fix del bug checkout vs MP)

```typescript
// El bug original: el servidor enviaba a MP unit_price = Math.round(total/quantity).
// MP cobra unit_price * quantity. Como Math.round pierde precision,
// unit_price * quantity != total. El cliente veia total, MP cobraba otra cosa.

// Regla de redondeo (opcion 4 confirmada por el usuario):
//   - Si rawTotal ya es entero, no se redondea.
//   - Si rawTotal tiene decimales, ceil al entero mas cercano.
//     Beneficia al vendedor; el cliente ve un numero entero que coincide
//     con el cobro de MP.
//   - unitPrice = total / pricingQuantity, redondeado a 2 decimales para MP.
//     En el peor caso (division no entera) MP puede redondear 1 centavo
//     por unidad, diferencia aceptable en ARS.
//
// Para Caso A unit_only (pack/conjunto) se usa el modelo per-pack directo:
// effectiveQuantity = packs, unitPrice = config.unit_price, total = packs * config.unit_price.
// Asi unitPrice * quantity = packPrice * packs = total exacto, sin artefacto
// de centavos por division no entera del per-piece.

// Caso A unit_only: model "per-pack"
//   config.unit_price = 15000, packSize = 8
//   pieces = 8 -> packs = 1
//   effectiveQuantity = 1 (pack)
//   unitPrice = 15000 (per pack)
//   total = 1 * 15000 = 15000
//   Cart recibe: item.price = 15000, item.quantity = 1, item.total_price = 15000
//   MP cobra: 15000 * 1 = 15000 (exacto)
//
// Caso B / C / D: modelo per-piece con redondeo condicional
//   total = rawTotal (si entero) o Math.ceil(rawTotal) (si tiene decimales)
//   unitPrice = Math.round((total / quantity) * 100) / 100

// Esto se aplica en:
// - product-detail.tsx -> computeItemPricing
// - api/orders/route.ts, api/orders/create-cash/route.ts, api/payments/create-preference/route.ts
```

### Reglas del modelo per-pack en el cart (Caso A unit_only)

```typescript
// Para Caso A unit_only, el cart recibe:
//   item.price = packPrice (precio por pack)
//   item.quantity = packs (cantidad de packs, NO piezas)
//   item.total_price = packPrice * packs (total exacto)
//
// El cart code (cart-drawer, cart-button, checkout-form) debe:
//   - Para unit_only: usar item.quantity directamente como packs
//   - Multiplicar por config.quantity para mostrar piezas equivalentes
//   - Mostrar "X packs (Y unidades)" en el cart drawer
//   - Mostrar "$packPrice x X packs (Y unidades)" en el checkout-form
//
// Para los demas casos, item.quantity sigue siendo customer-facing (piezas o counter).
```

### Reglas del boton "Opcion sin adicionales" (single-type)

```typescript
// Para opciones de seleccion unica (RadioGroup), como no se puede deseleccionar
// un radio button manualmente, se agrega un boton "Opcion sin adicionales"
// debajo del RadioGroup que solo aparece cuando hay algo seleccionado.
// Al hacer click, elimina la key del option en selectedOptions,
// volviendo al estado "default" (total = product.price).
//
// Texto: "Opcion sin adicionales"
// Estilo: variant="ghost", size="sm", color muted-foreground
// Solo aparece: !pricingConfig && selectedOptions[option.id] !== undefined
```

### Reglas del banner de admin (unica vez por tienda)

```typescript
// store_settings: agregar columna pricing_refactor_acknowledged_at TIMESTAMP NULL
// Componente AdminPricingRefactorBanner: visible solo si la columna es NULL.
//   - Muestra texto: "Actualizamos la forma de cargar precios de opciones.
//     A partir de ahora, el precio que cargues en cada variedad es el precio
//     completo, no un diferencial sobre el precio base. Esto hace mas claro el
//     menu para tus clientes y reduce errores al cargar el catalogo.
//     RevisÃƒÂ¡ los precios de tus opciones y confirmÃƒÂ¡ cuando estes de acuerdo."
//   - Boton "Entendido" Ã¢â€ â€™ UPDATE store_settings SET pricing_refactor_acknowledged_at = NOW()
//   - Dismiss se persiste en la DB (no en localStorage) para que aplique en todos los dispositivos
//   - No hay forma de reabrirlo desde el admin
```

## Archivos a tocar

### Calculo y core

- `lib/utils/pricing.ts` â€” `calculateSelectedOptionsPrice` reescrita para devolver `OptionsBreakdown`; nueva funcion `computeItemPricing` con 4 casos (A: pricing_config, B: quantity options, C: single/multiple, D: sin opciones). Caso A `unit_only` usa modelo per-pack (effectiveQuantity = packs). Caso C: single-type REEMPLAZA al base. Redondeo condicional a 0 decimales (solo si rawTotal tiene decimales).
- `lib/types/database.ts` â€” actualizar el comentario de `price_modifier` (linea 101). No se renombra.

### Store (cliente)

- `app/store/[slug]/product/[productId]/product-detail.tsx` â€” reescribir logica de calculo, ocultar el contador Plus/Minus en Caso B, reescribir el desglose del panel inferior (itemizado por variedad para Caso B y C), agregar console.log del breakdown, aplicar fix de redondeo. Header muestra el nombre de la variedad cuando hay single seleccionada.
- `app/store/[slug]/product/[productId]/components/product-options.tsx` â€” reescribir `calculateOptionPrice` y `getTotalAdditionalPrice`, ajustar badges (quitar "GRATIS", mostrar `$X` sin `+` cuando hay precio), quitar card "Costo adicional por opciones", agregar boton "Opcion sin adicionales" debajo del RadioGroup para single-type (solo visible si hay seleccion y no hay pricing_config).

### Admin

- `components/admin/product-options-form.tsx` â€” cambiar label del input ("Precio de la variedad"), cambiar color del borde (verde `$0`, azul `>0`, eliminar rojo), reescribir presets con precios absolutos (empanadas $1500-$1800, combo hamburguesa $0-$7200, etc), reescribir textos de ayuda y ejemplos, actualizar los badges del header ("Sin costo adicional" en vez de "gratis", "Con precio" en vez de "Con costo extra", "Hasta $X" en vez de "Hasta +$X").
- `components/admin/product-form.tsx` â€” sin cambios funcionales (el campo sigue llamandose `priceModifier` en el form, `price_modifier` en la DB).
- `components/admin/orders-table.tsx` â€” `formatPriceModifier` â†’ `formatOptionPrice` (sin `+`, usa " â€” "), `getSelectedOptionsSummary` reescrita para mostrar precio absoluto junto a la variedad en el ticket y en el modal de detalle.
- Nuevo: `components/admin/pricing-refactor-banner.tsx` â€” banner de unica vez con boton "Entendido" que persiste en `store_settings.pricing_refactor_acknowledged_at`.
- Nuevo script: `scripts/add-pricing-refactor-acknowledgement.sql` â€” agrega la columna a `store_settings`.

### API

- `app/api/orders/route.ts` â€” usar `computeItemPricing` y persistir el nuevo `pricing_snapshot` (con `source`, `breakdown`, `options_breakdown`, `raw_total`).
- `app/api/orders/create-cash/route.ts` â€” idem.
- `app/api/payments/create-preference/route.ts` â€” idem; ademas envia `item.price Ã— item.quantity` a MP (consistente con el cart y el order).
- `app/api/admin/pricing-refactor-ack/route.ts` (nuevo) â€” POST endpoint que actualiza el acknowledgement del banner.
- `app/admin/layout.tsx` â€” fetcha `store_settings` y renderiza el banner.
- `app/api/products/route.ts` y `app/api/products/[id]/route.ts` â€” sin cambios (la columna es la misma).
- Nuevo script: `scripts/migrate-price-modifier-to-absolute.sql` â€” UPDATE por cada tienda convirtiendo `product_option_values.price_modifier = product_option_values.price_modifier + products.price` (asume que el precio base no fue cambiado desde que se cargaron los options).
- Nuevo script: `scripts/document-price-modifier-semantics.sql` â€” `COMMENT ON COLUMN` para reflejar la nueva semantica.

### Cart (actualizacion del modelo per-pack)

El cart recibia `item.price = per-piece` y `item.quantity = pieces` para unit_only, lo que producia un artefacto de centavos en el display. Se cambio a:

- `components/store/cart-drawer.tsx` â€” `getPackInfo` reemplaza a `getPackQuantity`; para unit_only, `item.quantity` ya es packs y se multiplica por `config.quantity` para mostrar piezas equivalentes.
- `components/store/cart-button.tsx` â€” quitada la division `item.quantity / config.quantity`; para unit_only, `item.quantity` ya es packs.
- `components/store/checkout-form.tsx` â€” restructurado el check del config; para unit_only, label "pack" en vez de "unidad" y muestra piezas equivalentes.

### Documentacion

- `ARCHITECTURE.md` â€” linea 171: actualizar el comentario de `price_modifier` a "Precio absoluto de la variedad". Seccion Pricing: agregar nota "Precio de variedades" con las reglas Caso A/B/C/D y la regla de redondeo.

## Archivos que NO se tocan (legado preservado)

Por convencion del proyecto (proyecto vibecodeado, refactors no deben propagarse a codigo adyacente):

- `lib/utils/order-validation.ts` â€” no toca `price_modifier`.
- Toda la capa de WhatsApp, webhooks de MP, queue, product-card, product-catalog â€” leen snapshots o prices ya calculados.
- `app/api/admin/orders/route.ts`, `app/api/process-pending-sessions/route.ts`, `app/api/webhook/*` â€” no recalculan precios.
- Codigo muerto en `product-detail.tsx:77-114` (`calculateAdditionalPrice`, `finalPrice`) â€” se mantiene aunque no se use, no es alcance de este task.
- Parametro `pricingConfigOverride` (parametro inutilizado en `calculateSelectedOptionsPrice`) â€” se mantiene.
- `useEffect` con dependencias potencialmente loops en `product-options.tsx:108-166` â€” se mantiene.
- Validacion de `is_required` que no bloquea el boton "Agregar al Pedido" â€” fuera de scope.
- `app/demo/page.tsx` (mock data desactualizado) â€” fuera de scope.
- `components/store/cart-context.tsx` â€” se conserva (el reducer ya soporta `total_price`).
- `components/store/cart-drawer.tsx`, `cart-button.tsx`, `checkout-form.tsx` â€” TOCADOS para Caso A unit_only (modelo per-pack). El resto de su logica no se toco.

## Migracion de datos para el agente

Esta seccion describe los pasos que el agente debe ejecutar en orden.

### Paso 1: agregar columna de acknowledgement

```sql
-- scripts/add-pricing-refactor-acknowledgement.sql
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS pricing_refactor_acknowledged_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN store_settings.pricing_refactor_acknowledged_at IS
  'Fecha en que el owner confirmo estar al tanto del cambio de modelo de precios (delta a absoluto). NULL = pendiente.';
```

### Paso 2: migrar precios existentes (delta a absoluto)

```sql
-- scripts/migrate-price-modifier-to-absolute.sql
-- IMPORTANTE: confirmar con el dueno del proyecto antes de ejecutar.
-- Asume que product.price no fue modificado despues de cargar los options.
-- Si el dueno ya habia ajustado precios de varieties pensando como deltas,
-- este script convertira correctamente. Si habia mezclas, hay que revisar caso por caso.

UPDATE product_option_values pov
SET price_modifier = pov.price_modifier + COALESCE(p.sale_price, p.price)
FROM product_options po
JOIN products p ON p.id = po.product_id
WHERE po.id = pov.option_id
  AND pov.price_modifier IS NOT NULL
  AND pov.price_modifier != 0
  AND p.pricing_config IS NULL;
-- Solo migra productos SIN pricing_config (los que tenian el modelo de deltas).
-- Los productos con pricing_config no se ven afectados (el cliente paga el unit_price del config).
```

### Paso 3: actualizar comentario de la columna

```sql
-- scripts/document-price-modifier-semantics.sql
COMMENT ON COLUMN product_option_values.price_modifier IS
  'Precio absoluto de la variedad. Antes de 2026-06 era un delta sobre products.price; ver tasks/05-pricing-absolute-varieties.md.';
```

### Paso 4: verificar

```sql
-- Verificar que no quedan precios negativos
SELECT COUNT(*) FROM product_option_values WHERE price_modifier < 0;
-- Esperado: 0 (o revisar manualmente si habia descuentos por variedad)

-- Verificar distribucion de precios por tienda
SELECT s.name, COUNT(*) AS values_count, MIN(pov.price_modifier) AS min_price, MAX(pov.price_modifier) AS max_price
FROM product_option_values pov
JOIN product_options po ON po.id = pov.option_id
JOIN products p ON p.id = po.product_id
JOIN stores s ON s.id = p.store_id
WHERE p.pricing_config IS NULL
GROUP BY s.id, s.name
ORDER BY s.name;
```

## Criterios de exito verificables

### Smoke tests ejecutados y aprobados (smoke real en dispositivo del usuario, 2026-06-17)

Los 5 smoke tests pasaron.

**Producto del ejemplo Caso B (pizzeria don mario, empanadas)**: el contador Plus/Minus de cantidad del producto NO aparece, las variedades se eligen libremente, el desglose itemizado por variedad funciona, el cart y checkout muestran cantidad = suma de cantidades de variedades.

**Producto Caso A pack/conjunto ($15000/pack, 8 piezas)**: el storefront muestra $15000 sin decimales, el cart muestra "1 pack (8 unidades)" y total $15000, el checkout muestra "$15000 x 1 pack (8 unidades) = $15000", MP cobra $15000 exacto. Inicialmente aparecia 15000.02 en el cart por un artefacto de centavos al usar per-piece × pieces. Se corrigio cambiando a modelo per-pack en todo el flujo (cart y API).

**Producto Caso C single (hamburguesa)**: la variedad seleccionada REEMPLAZA al precio base (no se suma). Ejemplo: base $20, "papas y gaseosa mediana" = $45 absoluto, al seleccionar esa opcion el total = $45 (no $20+$45). El boton "Opcion sin adicionales" permite volver al estado default ($20).

**Producto Caso C single + multiple**: el total es `singleVariety.absolutePrice + sum(multipleVariety.absolutePrice) * quantity`. Sin interaccion especial entre ellos (caso D no resuelto, dejada como conocida limitacion de UX).

**Producto Caso D (sin opciones)**: comportamiento clasico `product.price * quantity`. Sin cambios respecto al estado anterior.

### Smoke tests originales (especificacion, no necesariamente todos ejecutados)

Producto: `localhost:3000/store/pizzeria-don-mario/product/7b22e6b9-578a-41cc-9660-4af28ecb8cfe`. El admin ya cargo precios absolutos en las 6 variedades de "elegir gustos de empanadas" (los precios son los que el admin haya puesto, ej: Carne $1200, Pollo $1200, JyQ $1300, Verdura $1200, Humita $1400, Caprese $1500).

- [x] Elegir 2 de Carne, 1 de Pollo, 3 de JyQ. El panel inferior muestra: una fila por variedad `2 Ã— Carne @ $1200 = $2400`, `1 Ã— Pollo @ $1200 = $1200`, `3 Ã— JyQ @ $1300 = $3900`. Total: `$7500`.
- [x] NO aparece el contador Plus/Minus de cantidad del producto.
- [x] Console del navegador muestra un objeto JSON con el breakdown completo: `{ total, breakdown, optionsBreakdown, pricingQuantity }`.
- [x] Agregar al pedido. Ir al carrito, verificar que el item aparece con cantidad `6` y total `$7500`.
- [x] En el checkout, el resumen muestra `$${item.price} x 6 unidades = $7500` y el total general coincide con lo que se cobra.
- [x] Ir a MercadoPago (checkout Pro). El total que pide MP es EXACTAMENTE `$7500 + deliveryFee - cashDiscount` (lo que el cliente vio). Diferencia maxima aceptable: 0 centavos.
- [x] Completar la compra (o simularla). El `order_items.total_price` en la DB es `$7500` y `unit_price * quantity` da lo mismo.
- [x] El ticket impreso en el admin muestra cada variedad con su precio absoluto (ej. `2 x Carne â€” $2400`), sin `+`.

### Smoke test de producto sin opciones (regresion)

- [x] Producto sin opciones: el comportamiento es identico al actual (`product.price * quantity`).
- [x] Producto con `pricing_config` (pack de empanadas): el comportamiento es identico al actual (con modelo per-pack para evitar artefactos).

### Smoke test de opciones single/multiple (regresion)

- [x] Producto "Combo Hamburguesa" con single options cargadas con precios absolutos: el total = `singleVariety.absolutePrice` (NO `product.price + ...`, REEMPLAZA al base).
- [x] Producto "Pizza" con multiple options (ingredientes extra con precio absoluto): el total = `(basePrice + sumMultiple.absolutePrice) * quantity` (las multiple SI se suman al base).

### Smoke test del banner (admin)

- [x] Cualquier owner que no haya confirmado ve el banner en el dashboard `/admin` o `/admin/products`.
- [x] Click en "Entendido" oculta el banner y persiste `pricing_refactor_acknowledged_at` en la DB.
- [x] Recargar la pagina o entrar desde otro dispositivo: el banner ya no aparece.
- [x] El banner no aparece para owners que ya confirmaron.

### Smoke test del fix de bug checkout vs MP

- [x] Crear un pedido con un item que genere redondeo (ej: producto con opciones que resulte en un total que NO es divisible exacto por la cantidad). El total del checkout debe coincidir EXACTAMENTE con el cobro de MP.
- [x] Repetir con varios productos con diferentes combinaciones de opciones. Todos los totales coinciden.

## Riesgos y mitigaciones

- **Datos de tenants activos con precios mal cargados**: el script SQL de migracion hace una asuncion (precio base no fue modificado despues de cargar options). El banner pide al owner que revise. Si un owner carga precios absolutos sin darse cuenta, el resultado sera visible inmediatamente en su tienda.
- **Historial de ordenes pasadas**: las ordenes ya pagadas tienen `unit_price` y `total_price` persistidos. No se tocan. La vista de detalle de orden del admin y la vista del cliente siguen mostrando esos numeros historicos tal cual.
- **Cache del navegador**: despues del deploy, los clientes pueden tener la version vieja en cache. Forzar rebuild + invalidacion. No es alcance del agente, lo hace el owner.
- **Regresion en el calculo de MP**: el fix de redondeo (siempre al alza con `Math.ceil`) hace que el vendedor cobre igual o mas que el computo exacto en los casos donde el redondeo original generaba diferencia. La diferencia maxima es `quantity - 1` centavos. En la mayoria de los casos es 0 o 1 centavo.

## Lo que queda pendiente (fuera de este task, para futura iteracion)

- Migrar la pagina de demo `app/demo/page.tsx` con los mocks actualizados.
- Resolver el `useEffect` con dependencias potencialmente loops en `product-options.tsx:108-166`.
- Implementar la validacion de `is_required` que bloquee el boton "Agregar al Pedido".
- Refactor del codigo muerto en `product-detail.tsx:77-114` (`calculateAdditionalPrice`, `additionalPrice`, `finalPrice`).
- Quitar el parametro `pricingConfigOverride` inutilizado (eliminado al reescribir la funcion; el parametro murio con la firma nueva).
- Resolver el caso de un producto con single + quantity (limitaciÃ³n UX reconocida: el vendedor se ve obligado a cargar una variedad para cada adicional por cada variante de las opciones que reemplazan el precio base; el resultado es exponencial).
- Caso A `unit_half_dozen_dozen`: artefacto de centavos para division no entera del per-piece (raro en practica porque los precios son enteros). Misma logica de fix podria aplicarse si aparecen casos.
- Tests automatizados (no hay framework en el proyecto, pendiente arquitectonico).

## Notas para el agente

- Commit y push SOLO despues de que el usuario confirme que los smoke tests manuales pasaron en el dispositivo real. Esta es una regla global del proyecto.
- Antes de empezar a codear, relee el task file completo. Si algo no se entiende, pregunta antes de improvisar.
- Los console.log de debugging en el navegador son obligatorios, no opcionales. Ayudan a detectar inconsistencias que son imposibles de ver en el codigo.
- NO refactorizar codigo adyacente aunque se vea mal. El proyecto tiene mucho codigo legacy intencionalmente preservado.
- Si durante la implementacion aparece un caso no contemplado en este task, PARAR y consultar al usuario antes de improvisar.
- El cart code (cart-drawer.tsx, cart-button.tsx, checkout-form.tsx) fue una EXCEPCION a la regla de no tocar legacy, justificada por el bug del artefacto de centavos (15000.02) que solo se podia arreglar actualizando esos archivos. Documentar siempre que se rompa esta regla.
