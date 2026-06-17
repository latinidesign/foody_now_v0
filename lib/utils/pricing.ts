export type UnitOnlyPricing = {
  mode: "unit_only"
  unit_price: number
  quantity: number
}

export type UnitHalfDozenDozenPricing = {
  mode: "unit_half_dozen_dozen"
  unit_price: number
  half_dozen_price: number
  dozen_price: number
}

export type PricingConfig = UnitOnlyPricing | UnitHalfDozenDozenPricing

export type PricingBreakdownItem = {
  type: "unit" | "half_dozen" | "dozen"
  quantity: number
  unit_size?: number
  unit_price: number
  total: number
}

export type PricingResult = {
  total: number
  breakdown: PricingBreakdownItem[]
}

export type OptionBreakdownItem =
  | {
      type: "variety_single"
      optionId: string
      valueId: string
      name: string
      unitPrice: number
      subtotal: number
    }
  | {
      type: "variety_multiple"
      optionId: string
      valueId: string
      name: string
      unitPrice: number
      subtotal: number
    }
  | {
      type: "variety_quantity"
      optionId: string
      valueId: string
      name: string
      unitPrice: number
      quantity: number
      subtotal: number
    }

export type OptionsBreakdown = {
  items: OptionBreakdownItem[]
  total: number
}

export type ItemPricingSource =
  | "pricing_config"
  | "quantity_options"
  | "single_multiple_options"
  | "base_only"

export type ItemPricing = {
  pricingQuantity: number
  rawTotal: number
  unitPrice: number
  total: number
  breakdown: PricingBreakdownItem[]
  optionsBreakdown: OptionsBreakdown
  source: ItemPricingSource
}

function ensureNumber(value: unknown, fieldName: string): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  throw new Error(`Invalid or missing pricing configuration value: ${fieldName}`)
}

export function parsePricingConfig(raw: unknown): PricingConfig | undefined {
  if (raw == null) {
    return undefined
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("pricing_config must be an object")
  }

  const config = raw as Record<string, unknown>
  const mode = config.mode

  if (mode === "unit_only") {
    return {
      mode: "unit_only",
      unit_price: ensureNumber(config.unit_price, "unit_price"),
      quantity: ensureNumber(config.quantity, "quantity"),
    }
  }

  if (mode === "unit_half_dozen_dozen") {
    return {
      mode: "unit_half_dozen_dozen",
      unit_price: ensureNumber(config.unit_price, "unit_price"),
      half_dozen_price: ensureNumber(config.half_dozen_price, "half_dozen_price"),
      dozen_price: ensureNumber(config.dozen_price, "dozen_price"),
    }
  }

  throw new Error(`Unknown pricing mode: ${String(mode)}`)
}

export function calculateProductPrice({
  product,
  quantity,
}: {
  product: {
    price: number
    sale_price?: number | null
    pricing_config?: unknown | null
  }
  quantity: number
}): PricingResult {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive number")
  }

  const config = parsePricingConfig(product.pricing_config)

  if (!config) {
    const unitPrice = Number.isFinite(product.sale_price ?? NaN)
      ? (product.sale_price as number)
      : product.price

    const total = unitPrice * quantity

    return {
      total,
      breakdown: [
        {
          type: "unit",
          quantity,
          unit_price: unitPrice,
          total,
        },
      ],
    }
  }

  switch (config.mode) {
    case "unit_only":
      return calculateUnitOnly(quantity, config)
    case "unit_half_dozen_dozen":
      return calculateEmpanadas(quantity, config)
    default:
      throw new Error("Unknown pricing mode")
  }
}

function calculateUnitOnly(quantity: number, config: UnitOnlyPricing): PricingResult {
  if (!Number.isFinite(config.unit_price) || config.unit_price < 0) {
    throw new Error("Invalid unit_price in pricing_config")
  }

  if (!Number.isFinite(config.quantity) || config.quantity < 1) {
    throw new Error("Invalid quantity in pricing_config")
  }

  const packs = Math.ceil(quantity / config.quantity)
  const total = packs * config.unit_price
  return {
    total,
    breakdown: [
      {
        type: "unit",
        quantity: packs,
        unit_size: config.quantity,
        unit_price: config.unit_price,
        total,
      },
    ],
  }
}

function calculateEmpanadas(quantity: number, config: UnitHalfDozenDozenPricing): PricingResult {
  const { unit_price, half_dozen_price, dozen_price } = config

  if (!Number.isFinite(unit_price) || unit_price < 0) {
    throw new Error("Invalid unit_price in pricing_config")
  }
  if (!Number.isFinite(half_dozen_price) || half_dozen_price < 0) {
    throw new Error("Invalid half_dozen_price in pricing_config")
  }
  if (!Number.isFinite(dozen_price) || dozen_price < 0) {
    throw new Error("Invalid dozen_price in pricing_config")
  }

  let remaining = quantity
  let total = 0
  const breakdown: PricingBreakdownItem[] = []

  const dozens = Math.floor(remaining / 12)
  if (dozens > 0) {
    const subtotal = dozens * dozen_price
    total += subtotal
    breakdown.push({
      type: "dozen",
      quantity: dozens,
      unit_size: 12,
      unit_price: dozen_price,
      total: subtotal,
    })
    remaining -= dozens * 12
  }

  const halves = Math.floor(remaining / 6)
  if (halves > 0) {
    const subtotal = halves * half_dozen_price
    total += subtotal
    breakdown.push({
      type: "half_dozen",
      quantity: halves,
      unit_size: 6,
      unit_price: half_dozen_price,
      total: subtotal,
    })
    remaining -= halves * 6
  }

  if (remaining > 0) {
    const subtotal = remaining * unit_price
    total += subtotal
    breakdown.push({
      type: "unit",
      quantity: remaining,
      unit_price,
      total: subtotal,
    })
  }

  return { total, breakdown }
}

function getOptionValues(option: any) {
  if (Array.isArray(option.values)) {
    return option.values
  }
  if (Array.isArray(option.product_option_values)) {
    return option.product_option_values
  }
  return []
}

/**
 * Devuelve el desglose de las opciones/variedades elegidas.
 * En el modelo actual `price_modifier` es el precio ABSOLUTO de la variedad
 * (no un delta sobre `product.price`). La funcion NO combina con `product.price`;
 * la combinacion la hace el caller segun el modo del producto.
 */
export function calculateSelectedOptionsPrice(
  product: { product_options?: any[] | null },
  selectedOptions?: Record<string, unknown> | null,
): OptionsBreakdown {
  const items: OptionBreakdownItem[] = []

  if (!selectedOptions || typeof selectedOptions !== "object") {
    return { items, total: 0 }
  }

  const productOptions = Array.isArray(product.product_options) ? product.product_options : []

  for (const option of productOptions) {
    const optionId = String(option.id)
    const selectedValue = (selectedOptions as Record<string, unknown>)[optionId]
    if (selectedValue == null) {
      continue
    }

    const optionValues = getOptionValues(option)
    const findValue = (vid: string) => optionValues.find((v: any) => String(v.id) === String(vid))

    if (
      option.type === "quantity" &&
      selectedValue &&
      typeof selectedValue === "object" &&
      !Array.isArray(selectedValue)
    ) {
      for (const [valueId, qty] of Object.entries(selectedValue)) {
        const parsedQty = Number(qty)
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
          continue
        }
        const value = findValue(valueId)
        if (!value) {
          continue
        }
        const unitPrice = Number(value.price_modifier) || 0
        const subtotal = unitPrice * parsedQty
        items.push({
          type: "variety_quantity",
          optionId,
          valueId: String(valueId),
          name: value.name,
          unitPrice,
          quantity: parsedQty,
          subtotal,
        })
      }
      continue
    }

    if (option.type === "multiple" && Array.isArray(selectedValue)) {
      for (const valueId of selectedValue) {
        const value = findValue(String(valueId))
        if (!value) {
          continue
        }
        const unitPrice = Number(value.price_modifier) || 0
        items.push({
          type: "variety_multiple",
          optionId,
          valueId: String(valueId),
          name: value.name,
          unitPrice,
          subtotal: unitPrice,
        })
      }
      continue
    }

    if (option.type === "single") {
      const value = findValue(String(selectedValue))
      if (!value) {
        continue
      }
      const unitPrice = Number(value.price_modifier) || 0
      items.push({
        type: "variety_single",
        optionId,
        valueId: String(selectedValue),
        name: value.name,
        unitPrice,
        subtotal: unitPrice,
      })
    }
  }

  const total = items.reduce((sum, item) => sum + item.subtotal, 0)
  return { items, total }
}

/**
 * Calcula el precio final de un item del carrito decidiendo que fuente usar
 * segun el modo del producto y las opciones seleccionadas.
 *
 * Reglas de combinacion:
 *  - Caso A (pricing_config != null): total viene del pricing_config; las opciones
 *    no participan del precio. pricingQuantity lo define el caller.
 *  - Caso B (pricing_config null + opciones quantity-type seleccionadas): total =
 *    sum(qty * variety.absolutePrice). product.price NO participa.
 *    pricingQuantity = suma de cantidades de variedades quantity-type.
 *  - Caso C (pricing_config null + opciones single/multiple seleccionadas, sin
 *    quantity): si hay una opcion single-type seleccionada, su precio REEMPLAZA
 *    a product.price (no se suma). Las opciones multiple-type SI se suman.
 *    Si no hay single pero si multiple, se suman al product.price.
 *  - Caso D (pricing_config null + sin opciones seleccionadas): total =
 *    product.price * pricingQuantity. pricingQuantity lo define el caller.
 *
 * Regla de redondeo: si rawTotal ya es entero, no se redondea. Si tiene
 * decimales, ceil al entero mas cercano (beneficia al vendedor).
 * unitPrice = total / pricingQuantity, redondeado a 2 decimales para MP.
 */
export function computeItemPricing(args: {
  product: {
    price: number
    sale_price?: number | null
    pricing_config?: unknown | null
    product_options?: any[] | null
  }
  pricingQuantity: number
  selectedOptions?: Record<string, unknown> | null
}): ItemPricing {
  const { product, pricingQuantity, selectedOptions } = args

  const optionsBreakdown = calculateSelectedOptionsPrice(product, selectedOptions)
  const hasOptionsSelected = optionsBreakdown.items.length > 0
  const hasQuantityOptionSelected = optionsBreakdown.items.some(
    (i) => i.type === "variety_quantity",
  )
  const config = parsePricingConfig(product.pricing_config)

  let rawTotal = 0
  let breakdown: PricingBreakdownItem[] = []
  let source: ItemPricingSource
  let effectiveQuantity = pricingQuantity

  if (config) {
    if (config.mode === "unit_only") {
      // Caso A unit_only (pack/conjunto): el precio es por pack.
      // effectiveQuantity = packs (no piezas), asi el cart y MP usan el
      // precio por pack × packs = total, sin artefacto de centavos por
      // division no entera del per-piece.
      const packSize = config.quantity
      const packs = Math.max(1, Math.ceil(pricingQuantity / packSize))
      rawTotal = packs * config.unit_price
      breakdown = [
        {
          type: "unit",
          quantity: packs,
          unit_size: packSize,
          unit_price: config.unit_price,
          total: rawTotal,
        },
      ]
      effectiveQuantity = packs
      source = "pricing_config"
    } else {
      const pricing = calculateProductPrice({ product, quantity: pricingQuantity })
      rawTotal = pricing.total
      breakdown = pricing.breakdown
      source = "pricing_config"
    }
  } else if (hasQuantityOptionSelected) {
    // Caso B: opciones por cantidad. product.price NO participa.
    rawTotal = optionsBreakdown.total
    const quantitySum = optionsBreakdown.items
      .filter((i) => i.type === "variety_quantity")
      .reduce((sum, i) => sum + (i as Extract<OptionBreakdownItem, { type: "variety_quantity" }>).quantity, 0)
    effectiveQuantity = quantitySum > 0 ? quantitySum : pricingQuantity
    breakdown = []
    source = "quantity_options"
  } else if (hasOptionsSelected) {
    // Caso C: single/multiple options.
    // Si hay una opcion single-type seleccionada, su precio REEMPLAZA al precio
    // base (no se suma). Los multiples-type SI se suman.
    // Si solo hay multiple-type seleccionadas (sin single), se suman al base.
    const basePrice = Number.isFinite(product.sale_price ?? NaN)
      ? (product.sale_price as number)
      : product.price
    const singleItems = optionsBreakdown.items.filter(
      (i) => i.type === "variety_single",
    )
    const multipleItems = optionsBreakdown.items.filter(
      (i) => i.type === "variety_multiple",
    )
    const singleSum = singleItems.reduce((sum, i) => sum + (i as Extract<OptionBreakdownItem, { type: "variety_single" }>).unitPrice, 0)
    const multipleSum = multipleItems.reduce((sum, i) => sum + (i as Extract<OptionBreakdownItem, { type: "variety_multiple" }>).unitPrice, 0)

    const baseForTotal = singleItems.length > 0 ? 0 : basePrice
    const perItemTotal = baseForTotal + singleSum + multipleSum
    rawTotal = perItemTotal * pricingQuantity

    breakdown = []
    if (singleItems.length > 0) {
      for (const item of singleItems) {
        const v = item as Extract<OptionBreakdownItem, { type: "variety_single" }>
        breakdown.push({
          type: "unit",
          quantity: pricingQuantity,
          unit_price: v.unitPrice,
          total: v.unitPrice * pricingQuantity,
        })
      }
    } else {
      breakdown.push({
        type: "unit",
        quantity: pricingQuantity,
        unit_price: basePrice,
        total: basePrice * pricingQuantity,
      })
    }
    for (const item of multipleItems) {
      const v = item as Extract<OptionBreakdownItem, { type: "variety_multiple" }>
      breakdown.push({
        type: "unit",
        quantity: pricingQuantity,
        unit_price: v.unitPrice,
        total: v.unitPrice * pricingQuantity,
      })
    }
    source = "single_multiple_options"
  } else {
    // Caso D: sin opciones seleccionadas. product.price * pricingQuantity.
    const basePrice = Number.isFinite(product.sale_price ?? NaN)
      ? (product.sale_price as number)
      : product.price
    rawTotal = basePrice * pricingQuantity
    breakdown = [
      { type: "unit", quantity: pricingQuantity, unit_price: basePrice, total: rawTotal },
    ]
    source = "base_only"
  }

  const safeQuantity = effectiveQuantity > 0 ? effectiveQuantity : 1
  // Regla de redondeo (opcion 4 confirmada por el usuario):
  //   - Si rawTotal ya es entero, no se redondea.
  //   - Si rawTotal tiene decimales, ceil al entero mas cercano (beneficia al vendedor).
  //   - unitPrice = total / safeQuantity, redondeado a 2 decimales para que MP
  //     reciba un valor razonable. En el peor caso (division no entera) MP puede
  //     redondear 1 centavo por unidad, diferencia aceptable en ARS.
  const isInteger = Number.isInteger(rawTotal)
  const total = isInteger ? rawTotal : Math.ceil(rawTotal)
  const unitPrice = safeQuantity > 0 ? Math.round((total / safeQuantity) * 100) / 100 : 0

  return {
    pricingQuantity: safeQuantity,
    rawTotal,
    unitPrice,
    total,
    breakdown,
    optionsBreakdown,
    source,
  }
}
