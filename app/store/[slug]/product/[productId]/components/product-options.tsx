"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, DollarSign } from "lucide-react"
import { useState } from "react"

interface ProductOptionsProps {
  options: any[]
  selectedOptions: Record<string, any>
  onOptionsChange: (options: Record<string, any>) => void
}

export function ProductOptions({ options, selectedOptions, onOptionsChange }: ProductOptionsProps) {
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

  const handleQuantityChange = (optionId: string, valueId: string, quantity: number) => {
    const currentQuantities = quantities[optionId] || {}
    const newQuantities = {
      ...quantities,
      [optionId]: {
        ...currentQuantities,
        [valueId]: Math.max(0, quantity),
      },
    }
    setQuantities(newQuantities)

    // Update selected options with quantities
    const selectedQuantities = Object.entries(newQuantities[optionId] || {})
      .filter(([_, qty]) => qty > 0)
      .reduce((acc, [valueId, qty]) => ({ ...acc, [valueId]: qty }), {})

    onOptionsChange({
      ...selectedOptions,
      [optionId]: selectedQuantities,
    })
  }

  const getQuantity = (optionId: string, valueId: string) => {
    return quantities[optionId]?.[valueId] || 0
  }

  const getTotalQuantity = (optionId: string) => {
    const optionQuantities = quantities[optionId] || {}
    return Object.values(optionQuantities).reduce((sum: number, qty: number) => sum + qty, 0)
  }

  const calculateOptionPrice = (option: any, selectedValue?: any, selectedQuantities?: Record<string, number>) => {
    if (option.type === "quantity" && selectedQuantities) {
      return Object.entries(selectedQuantities).reduce((total, [valueId, qty]) => {
        const value = option.values?.find((v: any) => v.id === valueId)
        return total + (value?.price_modifier || 0) * qty
      }, 0)
    }

    if (option.type === "multiple" && Array.isArray(selectedValue)) {
      return selectedValue.reduce((total, valueId) => {
        const value = option.values?.find((v: any) => v.id === valueId)
        return total + (value?.price_modifier || 0)
      }, 0)
    }

    if (option.type === "single" && selectedValue) {
      const value = option.values?.find((v: any) => v.id === selectedValue)
      return value?.price_modifier || 0
    }

    return 0
  }

  const getTotalAdditionalPrice = () => {
    return options.reduce((total, option) => {
      const selectedValue = selectedOptions[option.id]
      const selectedQuantities = option.type === "quantity" ? selectedValue : null
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
        const optionPrice = calculateOptionPrice(option, selectedValue, selectedValue)

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
                  {option.values?.some((v: any) => v.price_modifier === 0) && (
                    <Badge variant="secondary" className="text-xs">
                      Opciones gratis
                    </Badge>
                  )}
                  {option.values?.some((v: any) => v.price_modifier > 0) && (
                    <Badge variant="default" className="text-xs">
                      Con costo extra
                    </Badge>
                  )}
                  {optionPrice > 0 && (
                    <Badge variant="default" className="text-xs">
                      +${optionPrice}
                    </Badge>
                  )}
                </div>
              </div>
              {option.type === "quantity" && getTotalQuantity(option.id) > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total seleccionado: {getTotalQuantity(option.id)} unidades
                  {optionPrice > 0 && ` (+$${optionPrice})`}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {option.type === "single" ? (
                <RadioGroup
                  value={selectedOptions[option.id] || ""}
                  onValueChange={(value) => handleOptionChange(option.id, value)}
                >
                  {option.values?.map((value: any) => (
                    <div key={value.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={value.id} id={value.id} />
                        <Label htmlFor={value.id} className="flex items-center gap-2 cursor-pointer">
                          {value.name}
                          {value.price_modifier === 0 && (
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
                  {option.values?.map((value: any) => (
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
                          {value.price_modifier === 0 && (
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
                  {option.values?.map((value: any) => (
                    <div key={value.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{value.name}</span>
                        {value.price_modifier === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            GRATIS
                          </Badge>
                        )}
                        {value.price_modifier !== 0 && (
                          <Badge variant={value.price_modifier > 0 ? "default" : "destructive"} className="text-xs">
                            {value.price_modifier > 0 ? "+" : ""}${value.price_modifier} c/u
                          </Badge>
                        )}
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
