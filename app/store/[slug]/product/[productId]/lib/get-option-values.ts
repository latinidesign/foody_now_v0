export interface OptionWithValues {
  values?: unknown
  product_option_values?: unknown
  [key: string]: unknown
}

export function getOptionValues(option?: OptionWithValues | null): unknown[] {
  if (Array.isArray(option?.values)) {
    return option.values as unknown[]
  }

  if (typeof option?.values === "string") {
    const stringifiedValues = option?.values as string

    try {
      const parsed = JSON.parse(stringifiedValues)
      if (Array.isArray(parsed)) {
        return parsed as unknown[]
      }
    } catch {
      // Ignore invalid JSON strings and continue to other fallbacks
    }
  }

  if (Array.isArray(option?.product_option_values)) {
    return option.product_option_values as unknown[]
  }

  return []
}
