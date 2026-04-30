export type UnitOnlyPricing = {
  mode: "unit_only"
  unit_price: number
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

  const total = config.unit_price * quantity
  return {
    total,
    breakdown: [
      {
        type: "unit",
        quantity,
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

export function calculateSelectedOptionsPrice(
  product: { product_options?: any[] | null; pricing_config?: unknown | null },
  selectedOptions?: Record<string, unknown> | null,
  pricingConfigOverride?: boolean,
): number {
  if (!selectedOptions || typeof selectedOptions !== "object") {
    return 0
  }

  const productOptions = Array.isArray(product.product_options) ? product.product_options : []
  let total = 0

  for (const option of productOptions) {
    const optionId = String(option.id)
    const selectedValue = (selectedOptions as Record<string, unknown>)[optionId]
    const optionValues = getOptionValues(option)

    if (option.type === "quantity" && selectedValue && typeof selectedValue === "object" && !Array.isArray(selectedValue)) {
      const isPricingProduct = pricingConfigOverride || Boolean(product.pricing_config)
      for (const [valueId, qty] of Object.entries(selectedValue)) {
        const parsedQty = Number(qty)
        if (!Number.isFinite(parsedQty) || parsedQty <= 0) continue
        const value = optionValues.find((v: any) => String(v.id) === valueId)
        if (isPricingProduct) {
          // Pricing config already includes base unit pricing. Ignore quantity-option base modifiers.
          total += 0
        } else {
          total += (value?.price_modifier ?? 0) * parsedQty
        }
      }
      continue
    }

    if (option.type === "multiple" && Array.isArray(selectedValue)) {
      for (const valueId of selectedValue) {
        const value = optionValues.find((v: any) => String(v.id) === String(valueId))
        total += value?.price_modifier ?? 0
      }
      continue
    }

    if (option.type === "single" && selectedValue != null) {
      const value = optionValues.find((v: any) => String(v.id) === String(selectedValue))
      total += value?.price_modifier ?? 0
      continue
    }
  }

  return total
}
