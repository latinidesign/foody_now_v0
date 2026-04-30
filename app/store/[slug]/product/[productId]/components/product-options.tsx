"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"

interface ProductOptionsProps {
  options: any[]
  selectedOptions: Record<string, any>
  onOptionsChange: (options: Record<string, any>) => void
  maxQuantity?: number
  pricingConfig?: { unit_price: number }
}

const getOptionValues = (option: any) => option.values ?? option.product_option_values ?? []
export function ProductOptions({ options, selectedOptions, onOptionsChange, maxQuantity, pricingConfig }: ProductOptionsProps) {
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({})

  const handleOptionChange = (optionId: string, value: any) => {
    onOptionsChange({
      ...selectedOptions,
      [optionId]: value,
    })
  }

  const handleMultipleOptionChange = (optionId: string, valueId: string, checked: boolean) => {
    const currentValues = selectedOptions[optionId] || []
    let newValues

    if (checked) {
      newValues = [...currentValues, valueId]
    } else {
      newValues = currentValues.filter((id: string) => id !== valueId)
    }

    onOptionsChange({
      ...selectedOptions,
      [optionId]: newValues,
    })
  }

  const getMaxAvailableForValue = (optionId: string, valueId: string) => {
    if (maxQuantity === undefined) {
      return Infinity
    }

    const currentQuantities = quantities[optionId] || {}
    const currentTotal = Object.values(currentQuantities).reduce((sum: number, qty: number) => sum + qty, 0)
    const currentValue = currentQuantities[valueId] || 0

    return Math.max(0, maxQuantity - (currentTotal - currentValue))
  }

  const handleQuantityChange = (optionId: string, valueId: string, quantity: number) => {
    const maxForValue = getMaxAvailableForValue(optionId, valueId)
    const value = Math.min(Math.max(0, quantity), maxForValue)

    const currentQuantities = quantities[optionId] || {}
    const newQuantities = {
      ...quantities,
      [optionId]: {
        ...currentQuantities,
        [valueId]: value,
      },
    }
    setQuantities(newQuantities)

    // Update selected options with quantities
    const selectedQuantities = Object.entries(newQuantities[optionId] || {})
      .filter(([_, qty]) => qty > 0)
      .reduce((acc, [valueId, qty]) => ({ ...acc, [valueId]: qty }), {})

    if (Object.keys(selectedQuantities).length === 0) {
      const nextOptions = { ...selectedOptions }
      delete nextOptions[optionId]
      onOptionsChange(nextOptions)
    } else {
      onOptionsChange({
        ...selectedOptions,
        [optionId]: selectedQuantities,
      })
    }
  }

  const getQuantity = (optionId: string, valueId: string) => {
    return quantities[optionId]?.[valueId] || 0
  }

  const getTotalQuantity = (optionId: string) => {
    const optionQuantities = quantities[optionId] || {}
    return Object.values(optionQuantities).reduce((sum: number, qty: number) => sum + qty, 0)
  }

  useEffect(() => {
    if (maxQuantity === undefined) {
      return
    }

    let changed = false
    const nextQuantities = { ...quantities }

    options.forEach((option) => {
      if (option.type !== "quantity") {
        return
      }

      const optionQuantities = { ...(nextQuantities[option.id] || {}) }
      let total = Object.values(optionQuantities).reduce((sum: number, qty: number) => sum + qty, 0)

      if (total <= maxQuantity) {
        return
      }

      const valueIds = Object.keys(optionQuantities)
      for (const valueId of valueIds.reverse()) {
        if (total <= maxQuantity) {
          break
        }

        const currentValue = optionQuantities[valueId]
        const overflow = total - maxQuantity
        const nextValue = Math.max(0, currentValue - overflow)

        if (nextValue !== currentValue) {
          optionQuantities[valueId] = nextValue
          total -= currentValue - nextValue
          changed = true
        }
      }

      nextQuantities[option.id] = Object.fromEntries(
        Object.entries(optionQuantities).filter(([, qty]) => qty > 0),
      )
    })

    if (!changed) {
      return
    }

    setQuantities(nextQuantities)

    const nextSelectedOptions = { ...selectedOptions }
    Object.entries(nextQuantities).forEach(([optionId, optionQuantities]) => {
      if (Object.keys(optionQuantities).length > 0) {
        nextSelectedOptions[optionId] = optionQuantities
      } else {
        delete nextSelectedOptions[optionId]
      }
    })

    onOptionsChange(nextSelectedOptions)
  }, [maxQuantity, options, quantities, onOptionsChange, selectedOptions])

  const calculateOptionPrice = (option: any, selectedValue?: any, selectedQuantities?: Record<string, number>) => {
    const optionValues = getOptionValues(option)

    if (option.type === "quantity" && selectedQuantities) {
      return Object.entries(selectedQuantities).reduce((total, [valueId, qty]) => {
        const value = optionValues.find((v: any) => v.id === valueId)
        if (pricingConfig) {
          return total + pricingConfig.unit_price * qty + (value?.price_modifier || 0)
        }
        return total + (value?.price_modifier || 0) * qty
      }, 0)
    }

    if (option.type === "multiple" && Array.isArray(selectedValue)) {
      return selectedValue.reduce((total, valueId) => {
        const value = optionValues.find((v: any) => v.id === valueId)
        return total + (value?.price_modifier || 0)
      }, 0)
    }

    if (option.type === "single" && selectedValue) {
      const value = optionValues.find((v: any) => v.id === selectedValue)
      return value?.price_modifier || 0
    }

    return 0
  }

  const getTotalAdditionalPrice = () => {
    return options.reduce((total, option) => {
      const selectedValue = selectedOptions[option.id]
      const selectedQuantities = option.type === "quantity" ? selectedValue : null

      if (pricingConfig && option.type === "quantity" && selectedQuantities) {
        return total + Object.entries(selectedQuantities).reduce((subtotal, [valueId, qty]) => {
          const value = getOptionValues(option).find((v: any) => v.id === valueId)
          return subtotal + (value?.price_modifier || 0) * qty
        }, 0)
      }

      return total + calculateOptionPrice(option, selectedValue, selectedQuantities)
    }, 0)
  }

  if (!options.length) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Opciones</h3>
        {getTotalAdditionalPrice() > 0 && (
          <Badge variant="default" className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            +${getTotalAdditionalPrice()}
          </Badge>
        )}
      </div>

      {options.map((option) => {
        const selectedValue = selectedOptions[option.id]
        const selectedQuantities = option.type === "quantity" ? selectedValue : undefined
        const optionPrice = calculateOptionPrice(option, selectedValue, selectedQuantities)
        const optionExtras = pricingConfig && option.type === "quantity" && selectedQuantities
          ? Object.entries(selectedQuantities).reduce((total, [valueId, qty]) => {
              const value = getOptionValues(option).find((v: any) => v.id === valueId)
              return total + (value?.price_modifier || 0) * qty
            }, 0)
          : optionPrice

        return (
          <Card key={option.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {option.name}
                  {option.is_required && <span className="text-destructive ml-1">*</span>}
                </CardTitle>
                <div className="flex gap-1">
                  {option.type === "quantity" && (
                    <Badge variant="outline" className="text-xs">
                      Por cantidad
                    </Badge>
                  )}
                  {(!pricingConfig || option.type !== "quantity") && getOptionValues(option).some((v: any) => v.price_modifier === 0) && (
                    <Badge variant="secondary" className="text-xs">
                      Opciones gratis
                    </Badge>
                  )}
                  {getOptionValues(option).some((v: any) => v.price_modifier > 0) && (
                    <Badge variant="default" className="text-xs">
                      Con costo extra
                    </Badge>
                  )}
                  {pricingConfig && option.type === "quantity" ? (
                    <Badge variant="default" className="text-xs">
                      ${pricingConfig.unit_price} c/u
                    </Badge>
                  ) : optionPrice > 0 ? (
                    <Badge variant="default" className="text-xs">
                      +${optionPrice}
                    </Badge>
                  ) : null}
                </div>
              </div>
              {option.type === "quantity" && (
                <p className="text-sm text-muted-foreground">
                  {maxQuantity !== undefined
                    ? `${Math.max(0, maxQuantity - getTotalQuantity(option.id))} de ${maxQuantity} disponibles`
                    : `Total seleccionado: ${getTotalQuantity(option.id)} unidades`}
                  {optionExtras > 0 && ` (+$${optionExtras})`}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {option.type === "single" ? (
                <RadioGroup
                  value={selectedOptions[option.id] || ""}
                  onValueChange={(value) => handleOptionChange(option.id, value)}
                >
                  {getOptionValues(option).map((value: any) => (
                    <div key={value.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={value.id} id={value.id} />
                        <Label htmlFor={value.id} className="flex items-center gap-2 cursor-pointer">
                          {value.name}
                          {!(pricingConfig && option.type === "quantity") && value.price_modifier === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              GRATIS
                            </Badge>
                          )}
                        </Label>
                      </div>
                      {value.price_modifier !== 0 && (
                        <Badge variant={value.price_modifier > 0 ? "default" : "destructive"} className="text-xs">
                          {value.price_modifier > 0 ? "+" : ""}${value.price_modifier}
                        </Badge>
                      )}
                    </div>
                  ))}
                </RadioGroup>
              ) : option.type === "multiple" ? (
                <div className="space-y-2">
                  {getOptionValues(option).map((value: any) => (
                    <div key={value.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={value.id}
                          checked={(selectedOptions[option.id] || []).includes(value.id)}
                          onCheckedChange={(checked) =>
                            handleMultipleOptionChange(option.id, value.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={value.id} className="flex items-center gap-2 cursor-pointer">
                          {value.name}
                          {!(pricingConfig && option.type === "quantity") && value.price_modifier === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              GRATIS
                            </Badge>
                          )}
                        </Label>
                      </div>
                      {value.price_modifier !== 0 && (
                        <Badge variant={value.price_modifier > 0 ? "default" : "destructive"} className="text-xs">
                          {value.price_modifier > 0 ? "+" : ""}${value.price_modifier}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {getOptionValues(option).map((value: any) => (
                    <div key={value.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{value.name}</span>
                        {!(pricingConfig && option.type === "quantity") && value.price_modifier === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            GRATIS
                          </Badge>
                        )}
                        {pricingConfig ? (
                          <Badge variant="default" className="text-xs">
                            +${pricingConfig.unit_price} c/u
                          </Badge>
                        ) : value.price_modifier !== 0 ? (
                          <Badge variant={value.price_modifier > 0 ? "default" : "destructive"} className="text-xs">
                            {value.price_modifier > 0 ? "+" : ""}${value.price_modifier} c/u
                          </Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(option.id, value.id, getQuantity(option.id, value.id) - 1)
                          }
                          disabled={getQuantity(option.id, value.id) <= 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium min-w-[2rem] text-center">{getQuantity(option.id, value.id)}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantityChange(option.id, value.id, getQuantity(option.id, value.id) + 1)
                          }
                          disabled={
                            maxQuantity !== undefined &&
                            getTotalQuantity(option.id) >= maxQuantity
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {getTotalAdditionalPrice() > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Costo adicional por opciones:</span>
              <Badge variant="default" className="text-base px-3 py-1">
                +${getTotalAdditionalPrice()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
