"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Trash2 } from "lucide-react"

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Adicionales y Opciones</Label>
        <Button type="button" variant="outline" onClick={addOption}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Opción
        </Button>
      </div>

      {options.map((option, optionIndex) => (
        <Card key={optionIndex}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Opción {optionIndex + 1}</CardTitle>
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
                  placeholder="Ej: Tamaño de Gaseosa"
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
                      placeholder="Ej: 500ml, 1 ltr"
                    />
                  </div>
                  <div className="w-32">
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
                    />
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

            <div className="text-xs text-muted-foreground">
              <p>
                <strong>Ejemplo:</strong> Para "Combo Pizza y Gaseosa":
              </p>
              <p>• Opción: "Tipo de Gaseosa" (Selección única, Obligatorio)</p>
              <p>• Valores: Coca-Cola ($0), Fanta ($0), Sprite ($0)</p>
              <p>• Opción: "Tamaño" (Selección única, Obligatorio)</p>
              <p>• Valores: 500ml ($0), 1 ltr ($50)</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {options.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No hay opciones configuradas para este producto</p>
            <Button type="button" variant="outline" onClick={addOption}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primera Opción
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
