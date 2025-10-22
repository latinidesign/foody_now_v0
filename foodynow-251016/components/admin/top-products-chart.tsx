"use client"

import { Progress } from "@/components/ui/progress"

interface TopProduct {
  name: string
  quantity: number
}

interface TopProductsChartProps {
  products: TopProduct[]
}

export function TopProductsChart({ products }: TopProductsChartProps) {
  if (!products.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay datos de productos para el período seleccionado
      </div>
    )
  }

  const maxQuantity = Math.max(...products.map((p) => p.quantity))

  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <div key={product.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium truncate flex-1 mr-2">
              {index + 1}. {product.name}
            </span>
            <span className="text-sm text-muted-foreground">{product.quantity} vendidos</span>
          </div>
          <Progress value={(product.quantity / maxQuantity) * 100} className="h-2" />
        </div>
      ))}
    </div>
  )
}
