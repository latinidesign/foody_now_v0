export type SelectedOptions = Record<string, unknown> | null | undefined

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export function getSelectedOptionsQuantityTotal(selectedOptions?: SelectedOptions): number {
  if (!selectedOptions || typeof selectedOptions !== "object") {
    return 0
  }

  let total = 0

  for (const rawValue of Object.values(selectedOptions)) {
    if (rawValue && typeof rawValue === "object" && !Array.isArray(rawValue)) {
      const entry = rawValue as Record<string, unknown>
      for (const value of Object.values(entry)) {
        total += toNumber(value)
      }
    }
  }

  return total
}

export function ensureSelectedOptionsQuantityWithinLimit(
  item: { quantity: number; selectedOptions?: SelectedOptions | null },
  maxUnitsPerProduct = 12,
) {
  const quantity = Number(item.quantity ?? 0)
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return
  }

  const total = getSelectedOptionsQuantityTotal(item.selectedOptions)
  if (total <= 0) {
    return
  }

  const allowedTotal = quantity * maxUnitsPerProduct
  if (total > allowedTotal) {
    throw new Error(
      `Total de opciones por cantidad (${total}) supera el máximo permitido de ${allowedTotal} para ${quantity} unidad(es).`,
    )
  }
}
