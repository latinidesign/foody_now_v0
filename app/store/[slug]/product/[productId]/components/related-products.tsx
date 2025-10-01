"use client"

import type { Product } from "@/lib/types/database"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { combineStorePath } from "@/lib/store/path"

interface RelatedProductsProps {
  products: Product[]
  storeSlug: string
  basePath?: string
}

export function RelatedProducts({ products, storeSlug, basePath }: RelatedProductsProps) {
  const resolvedBasePath = basePath ?? `/store/${storeSlug}`

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Productos Relacionados</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link key={product.id} href={combineStorePath(resolvedBasePath, `/product/${product.id}`)}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
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
              <CardContent className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 mb-2">{product.name}</h3>
                <div className="flex items-center justify-between">
                  {product.sale_price && product.sale_price < product.price ? (
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">${product.sale_price}</span>
                      <span className="text-xs text-muted-foreground line-through">${product.price}</span>
                    </div>
                  ) : (
                    <span className="font-bold text-primary">${product.price}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
