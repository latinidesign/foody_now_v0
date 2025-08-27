"use client"

import type { Product } from "@/lib/types/database"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Search, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

interface ProductWithCategory extends Product {
  categories?: { name: string } | null
}

interface ProductsTableProps {
  products: ProductWithCategory[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const toggleAvailability = async (productId: string, isAvailable: boolean) => {
    // TODO: Implement toggle availability
    console.log("Toggle availability:", productId, !isAvailable)
  }

  const deleteProduct = async (productId: string) => {
    // TODO: Implement delete product
    console.log("Delete product:", productId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Productos</CardTitle>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery ? "No se encontraron productos" : "No hay productos creados"}
            </p>
            {!searchQuery && (
              <Link href="/admin/products/new">
                <Button className="mt-4">Crear Primer Producto</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                {product.image_url && (
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <Badge variant={product.is_available ? "default" : "secondary"}>
                      {product.is_available ? "Disponible" : "No disponible"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{product.categories?.name || "Sin categoría"}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-primary">${product.price}</span>
                    {product.sale_price && product.sale_price < product.price && (
                      <span className="text-muted-foreground line-through">${product.sale_price}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAvailability(product.id, product.is_available)}
                  >
                    {product.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={() => deleteProduct(product.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
