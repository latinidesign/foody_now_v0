import { describe, expect, it } from "vitest"

import { getOptionValues } from "./get-option-values"

describe("getOptionValues", () => {
  it("returns the values array when provided", () => {
    const option = {
      values: [
        { id: "1", name: "Small", price_modifier: 0 },
        { id: "2", name: "Large", price_modifier: 2 },
      ],
    }

    expect(getOptionValues(option)).toEqual(option.values)
  })

  it("parses JSON stringified values", () => {
    const stringifiedValues = JSON.stringify([
      { id: "1", name: "Regular", price_modifier: 0 },
      { id: "2", name: "Extra", price_modifier: 1.5 },
    ])

    const option = {
      values: stringifiedValues,
    }

    expect(getOptionValues(option)).toEqual(JSON.parse(stringifiedValues))
  })

  it("falls back to relational product_option_values data", () => {
    const option = {
      product_option_values: [
        { id: "1", name: "Cheese", price_modifier: 0.5 },
      ],
    }

    expect(getOptionValues(option)).toEqual(option.product_option_values)
  })

  it("falls back to relational data when JSON parsing fails", () => {
    const option = {
      values: "not-json",
      product_option_values: [
        { id: "1", name: "Chocolate", price_modifier: 1 },
      ],
    }

    expect(getOptionValues(option)).toEqual(option.product_option_values)
  })

  it("returns an empty array when no valid values are available", () => {
    const option = {
      values: { id: "1" },
      product_option_values: null,
    }

    expect(getOptionValues(option)).toEqual([])
  })
})
