"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Trash2, Info, DollarSign } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProductOption {
  id?: string
  name: string
  type: "single" | "multiple" | "quantity"
  isRequired: boolean
  values: ProductOptionValue[]
}

interface ProductOptionValue {
  id?: string
  name: string
  priceModifier: number
}

interface ProductOptionsFormProps {
  options: ProductOption[]
  onChange: (options: ProductOption[]) => void
}

export function ProductOptionsForm({ options, onChange }: ProductOptionsFormProps) {
  const addOption = () => {
    const newOption: ProductOption = {
      name: "",
      type: "single",
      isRequired: false,
      values: [],
    }
    onChange([...options, newOption])
  }

  const addPresetOption = (preset: "empanadas" | "combo" | "hamburger-combo" | "pizza-sizes" | "drink-sizes") => {
    let newOption: ProductOption

    switch (preset) {
      case "empanadas":
        newOption = {
          name: "Elegir gustos de empanadas",
          type: "quantity",
          isRequired: true,
          values: [
            { name: "Carne", priceModifier: 0 },
            { name: "Pollo", priceModifier: 0 },
            { name: "Jamón y Queso", priceModifier: 0 },
            { name: "Verdura", priceModifier: 0 },
            { name: "Humita", priceModifier: 0 },
            { name: "Caprese", priceModifier: 0 },
          ],
        }
        break
      case "combo":
        newOption = {
          name: "Tamaño de papas",
          type: "single",
          isRequired: true,
          values: [
            { name: "Chicas", priceModifier: 0 },
            { name: "Medianas", priceModifier: 50 },
            { name: "Grandes", priceModifier: 100 },
          ],
        }
        break
      case "hamburger-combo":
        newOption = {
          name: "Combo Hamburguesa Doble",
          type: "single",
          isRequired: true,
          values: [
            { name: "Solo hamburguesa", priceModifier: 0 },
            { name: "Con papas chicas y gaseosa chica", priceModifier: 200 },
            { name: "Con papas medianas y gaseosa mediana", priceModifier: 350 },
            { name: "Con papas grandes y gaseosa grande", priceModifier: 500 },
          ],
        }
        break
      case "pizza-sizes":
        newOption = {
          name: "Tamaño de pizza",
          type: "single",
          isRequired: true,
          values: [
            { name: "Personal (25cm)", priceModifier: 0 },
            { name: "Mediana (30cm)", priceModifier: 300 },
            { name: "Grande (35cm)", priceModifier: 600 },
            { name: "Familiar (40cm)", priceModifier: 900 },
          ],
        }
        break
      case "drink-sizes":
        newOption = {
          name: "Tamaño de bebida",
          type: "single",
          isRequired: false,
          values: [
            { name: "Sin bebida", priceModifier: 0 },
            { name: "Chica (350ml)", priceModifier: 80 },
            { name: "Mediana (500ml)", priceModifier: 120 },
            { name: "Grande (1L)", priceModifier: 180 },
          ],
        }
        break
    }

    onChange([...options, newOption])
  }

  const updateOption = (index: number, field: keyof ProductOption, value: any) => {
    const updatedOptions = [...options]
    updatedOptions[index] = { ...updatedOptions[index], [field]: value }
    onChange(updatedOptions)
  }

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index)
    onChange(updatedOptions)
  }

  const addOptionValue = (optionIndex: number) => {
    const newValue: ProductOptionValue = {
      name: "",
      priceModifier: 0,
    }
    const updatedOptions = [...options]
    updatedOptions[optionIndex].values.push(newValue)
    onChange(updatedOptions)
  }

  const updateOptionValue = (optionIndex: number, valueIndex: number, field: keyof ProductOptionValue, value: any) => {
    const updatedOptions = [...options]
    updatedOptions[optionIndex].values[valueIndex] = {
      ...updatedOptions[optionIndex].values[valueIndex],
      [field]: value,
    }
    onChange(updatedOptions)
  }

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const updatedOptions = [...options]
    updatedOptions[optionIndex].values = updatedOptions[optionIndex].values.filter((_, i) => i !== valueIndex)
    onChange(updatedOptions)
  }

  const getFreeOptionsCount = (option: ProductOption) => {
    return option.values.filter((v) => v.priceModifier === 0).length
  }

  const getPaidOptionsCount = (option: ProductOption) => {
    return option.values.filter((v) => v.priceModifier > 0).length
  }

  const getMaxPrice = (option: ProductOption) => {
    return Math.max(...option.values.map((v) => v.priceModifier), 0)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Adicionales y Opciones</Label>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={() => addPresetOption("empanadas")}>
            <Plus className="w-4 h-4 mr-1" />
            Empanadas
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addPresetOption("hamburger-combo")}>
            <DollarSign className="w-4 h-4 mr-1" />
            Combo Hamburguesa
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addPresetOption("pizza-sizes")}>
            <DollarSign className="w-4 h-4 mr-1" />
            Tamaños Pizza
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addPresetOption("drink-sizes")}>
            <DollarSign className="w-4 h-4 mr-1" />
            Bebidas
          </Button>
          <Button type="button" variant="outline" onClick={addOption}>
            <Plus className="w-4 h-4 mr-2" />
            Personalizado
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Adicionales con costo:</strong> Configura diferentes precios para mostrar las diferencias al cliente.
          <br />
          <strong>Ejemplo:</strong> "Papas chicas ($0), Medianas (+$50), Grandes (+$100)"
        </AlertDescription>
      </Alert>

      {options.map((option, optionIndex) => (
        <Card key={optionIndex}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Opción {optionIndex + 1}</CardTitle>
                {getFreeOptionsCount(option) > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {getFreeOptionsCount(option)} gratis
                  </Badge>
                )}
                {getPaidOptionsCount(option) > 0 && (
                  <Badge variant="default" className="text-xs">
                    {getPaidOptionsCount(option)} con costo
                  </Badge>
                )}
                {getMaxPrice(option) > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Hasta +${getMaxPrice(option)}
                  </Badge>
                )}
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(optionIndex)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre de la Opción</Label>
                <Input
                  value={option.name}
                  onChange={(e) => updateOption(optionIndex, "name", e.target.value)}
                  placeholder="Ej: Tamaño de papas"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Selección</Label>
                <Select value={option.type} onValueChange={(value) => updateOption(optionIndex, "type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Selección única</SelectItem>
                    <SelectItem value="multiple">Selección múltiple</SelectItem>
                    <SelectItem value="quantity">Por cantidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  checked={option.isRequired}
                  onCheckedChange={(checked) => updateOption(optionIndex, "isRequired", checked)}
                />
                <Label className="text-sm">Obligatorio</Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Valores de la Opción</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addOptionValue(optionIndex)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Valor
                </Button>
              </div>

              {option.values.map((value, valueIndex) => (
                <div key={valueIndex} className="flex items-center gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      value={value.name}
                      onChange={(e) => updateOptionValue(optionIndex, valueIndex, "name", e.target.value)}
                      placeholder="Ej: Papas medianas, Gaseosa grande"
                    />
                  </div>
                  <div className="w-32 relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={value.priceModifier}
                      onChange={(e) =>
                        updateOptionValue(
                          optionIndex,
                          valueIndex,
                          "priceModifier",
                          Number.parseFloat(e.target.value) || 0,
                        )
                      }
                      placeholder="Precio extra"
                      className={
                        value.priceModifier === 0
                          ? "border-green-200 bg-green-50"
                          : value.priceModifier > 0
                            ? "border-blue-200 bg-blue-50"
                            : "border-red-200 bg-red-50"
                      }
                    />
                    {value.priceModifier === 0 && (
                      <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs px-1 py-0">
                        GRATIS
                      </Badge>
                    )}
                    {value.priceModifier > 0 && (
                      <Badge variant="default" className="absolute -top-2 -right-2 text-xs px-1 py-0">
                        +${value.priceModifier}
                      </Badge>
                    )}
                    {value.priceModifier < 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-1 py-0">
                        ${value.priceModifier}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOptionValue(optionIndex, valueIndex)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {option.values.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay valores agregados. Haz clic en "Agregar Valor" para comenzar.
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p className="font-medium mb-2">Ejemplos de configuración con precios:</p>

              {option.type === "single" && getPaidOptionsCount(option) > 0 && (
                <div className="space-y-1">
                  <p>
                    <strong>Combo Hamburguesa Doble:</strong>
                  </p>
                  <p>• Solo hamburguesa ($0)</p>
                  <p>• Con papas chicas y gaseosa chica (+$200)</p>
                  <p>• Con papas medianas y gaseosa mediana (+$350)</p>
                  <p>• Con papas grandes y gaseosa grande (+$500)</p>
                  <p className="text-green-600 font-medium">✓ El cliente ve claramente las diferencias de precio</p>
                </div>
              )}

              {option.type === "multiple" && getPaidOptionsCount(option) > 0 && (
                <div className="space-y-1">
                  <p>
                    <strong>Ingredientes Extra para Pizza:</strong>
                  </p>
                  <p>• Aceitunas ($0), Orégano ($0)</p>
                  <p>• Jamón (+$200), Queso extra (+$150)</p>
                  <p>• Camarones (+$400), Salmón (+$500)</p>
                </div>
              )}

              {option.type === "quantity" && (
                <div className="space-y-1">
                  <p>
                    <strong>Empanadas con Precios Variables:</strong>
                  </p>
                  <p>• Carne ($0), Pollo ($0), Jamón y Queso ($0)</p>
                  <p>• Mariscos (+$50 c/u), Salmón (+$80 c/u)</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {options.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No hay opciones configuradas para este producto</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button type="button" variant="outline" onClick={() => addPresetOption("empanadas")}>
                <Plus className="w-4 h-4 mr-2" />
                Empanadas
              </Button>
              <Button type="button" variant="outline" onClick={() => addPresetOption("hamburger-combo")}>
                <DollarSign className="w-4 h-4 mr-2" />
                Combo
              </Button>
              <Button type="button" variant="outline" onClick={() => addPresetOption("pizza-sizes")}>
                <DollarSign className="w-4 h-4 mr-2" />
                Tamaños
              </Button>
              <Button type="button" variant="outline" onClick={addOption}>
                <Plus className="w-4 h-4 mr-2" />
                Personalizado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
