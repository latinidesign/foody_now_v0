"use client"

import type { Product } from "@/lib/types/database"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Search, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ProductWithCategory extends Product {
  categories?: { name: string } | null
}

interface ProductsTableProps {
  products: ProductWithCategory[]
}

const PAGE_SIZE = 20

export function ProductsTable({ products }: ProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [updatedProducts, setUpdatedProducts] = useState<ProductWithCategory[]>(products)

  const filteredProducts = updatedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const toggleAvailability = async (productId: string, isAvailable: boolean) => {
    try {
      const supabase = getBrowserClient()
      const { error } = await supabase.from("products").update({ is_available: !isAvailable }).eq("id", productId)

      if (error) throw error

      // Actualizar estado local
      setUpdatedProducts((prev) =>
        prev.map((product) => (product.id === productId ? { ...product, is_available: !isAvailable } : product)),
      )

      toast.success(`Producto ${!isAvailable ? "activado" : "desactivado"} correctamente`)
    } catch (error) {
      console.error("Error toggling availability:", error)
      toast.error("Error al cambiar disponibilidad del producto")
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return

    try {
      const supabase = getBrowserClient()
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error

      // Actualizar estado local
      setUpdatedProducts((prev) => prev.filter((product) => product.id !== productId))

      toast.success("Producto eliminado correctamente")
    } catch (error) {
      console.error("Error deleting product:", error)
      toast.error("Error al eliminar el producto")
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Lista de Productos</CardTitle>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
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
          <>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
                <span>{filteredProducts.length} productos</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span>{currentPage} / {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {paginatedProducts.map((product) => (
                <div key={product.id} className="bg-card rounded-2xl shadow-sm flex gap-2.5 p-2.5 md:gap-4 md:p-3.5 items-center">
                  {/* Image */}
                  <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-neutral-100">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-muted-foreground text-[10px]">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                    <div className="flex items-start gap-1.5">
                      <h3 className="font-semibold text-[15px] leading-tight line-clamp-1 flex-1">{product.name}</h3>
                      <Badge variant={product.is_available ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {product.is_available ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{product.categories?.name || "Sin categoría"}</p>
                    <div className="flex items-center justify-between mt-1.5 gap-2">
                      <div>
                        {product.pricing_config ? (
                          <span className="text-primary font-extrabold text-[13px]">Precio según cantidad</span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-primary font-extrabold">${product.price.toLocaleString("es-AR")}</span>
                            {product.sale_price && product.sale_price < product.price && (
                              <span className="text-muted-foreground line-through text-xs">${product.sale_price.toLocaleString("es-AR")}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleAvailability(product.id, product.is_available)}
                        >
                          {product.is_available ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-background border shadow-md">
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
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
