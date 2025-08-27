"use client"

import type { Product } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from "lucide-react"
import { useCart } from "./cart-context"
import { useState } from "react"

interface ProductCardProps {
  product: Product
  viewMode: "grid" | "list"
}

export function ProductCard({ product, viewMode }: ProductCardProps) {
  const { addItem, getItemQuantity, updateQuantity } = useCart()
  const [isAdding, setIsAdding] = useState(false)
  const quantity = getItemQuantity(product.id)

  const handleAddToCart = async () => {
    setIsAdding(true)
    await addItem({
      id: product.id,
      name: product.name,
      price: product.sale_price || product.price,
      image_url: product.image_url,
      quantity: 1,
    })
    setIsAdding(false)
  }

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity === 0) {
      updateQuantity(product.id, 0)
    } else {
      updateQuantity(product.id, newQuantity)
    }
  }

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {product.image_url && (
              <img
                src={product.image_url || "/placeholder.svg"}
                alt={product.name}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                <div className="text-right flex-shrink-0 ml-4">
                  {product.sale_price && product.sale_price < product.price ? (
                    <div>
                      <Badge variant="destructive" className="text-xs mb-1">
                        Oferta
                      </Badge>
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-primary">${product.sale_price}</span>
                        <span className="text-sm text-muted-foreground line-through">${product.price}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="font-bold text-lg text-primary">${product.price}</span>
                  )}
                </div>
              </div>
              {product.description && (
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex-1" />
                {quantity > 0 ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(quantity - 1)}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-medium min-w-[2rem] text-center">{quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(quantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleAddToCart} disabled={isAdding} size="sm">
                    {isAdding ? "Agregando..." : "Agregar"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-square relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Sin imagen</span>
          </div>
        )}
        {product.sale_price && product.sale_price < product.price && (
          <Badge variant="destructive" className="absolute top-2 left-2">
            Oferta
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between mb-4">
          {product.sale_price && product.sale_price < product.price ? (
            <div>
              <span className="font-bold text-lg text-primary">${product.sale_price}</span>
              <span className="text-sm text-muted-foreground line-through ml-2">${product.price}</span>
            </div>
          ) : (
            <span className="font-bold text-lg text-primary">${product.price}</span>
          )}
        </div>

        {quantity > 0 ? (
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(quantity - 1)}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="font-medium">{quantity}</span>
            <Button size="sm" variant="outline" onClick={() => handleUpdateQuantity(quantity + 1)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleAddToCart} disabled={isAdding} className="w-full">
            {isAdding ? "Agregando..." : "Agregar al Carrito"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
