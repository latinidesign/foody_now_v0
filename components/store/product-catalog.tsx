"use client"

import type { Store, Category, Product } from "@/lib/types/database"
import { useState } from "react"
import { ProductCard } from "./product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Grid, List } from "lucide-react"

interface ProductCatalogProps {
  store: Store
  categories: (Category & { products: Product[] })[]
}

export function ProductCatalog({ store, categories }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter products based on category and search
  const filteredProducts = categories.flatMap((category) => {
    if (selectedCategory && category.id !== selectedCategory) return []

    return category.products.filter((product) => {
      if (!product.is_available) return false
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  })

  const currentCategory = selectedCategory ? categories.find((cat) => cat.id === selectedCategory) : null

  return (
    <div className="space-y-6 px-6">
      {/* Welcome Message */}
      {store.description && (
        <div className="text-center py-6 border-0 rounded-lg bg-[rgba(230,218,197,1)] px-6 shadow-lg">
          <p className="text-muted-foreground max-w-2xl text-2xl mx-auto">{store.description}</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <Grid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {currentCategory && (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">{currentCategory.name}</h2>
            {currentCategory.description && <p className="text-muted-foreground mt-2">{currentCategory.description}</p>}
          </div>
          {currentCategory.image_url && (
            <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-lg overflow-hidden">
              <img
                src={currentCategory.image_url || "/placeholder.svg"}
                alt={currentCategory.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
          }
        >
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? "No se encontraron productos" : "No hay productos disponibles"}
          </p>
        </div>
      )}

      {/* Delivery Info */}
      <div className="bg-muted/50 rounded-lg p-6 mt-8">
        <h3 className="font-semibold mb-3">Información de Entrega</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Retiro en Local</p>
            <p className="text-muted-foreground">Gratis - {store.address}</p>
          </div>
          <div>
            <p className="font-medium">Delivery</p>
            <p className="text-muted-foreground">
              ${store.delivery_fee} - Radio de {store.delivery_radius}km
            </p>
            {store.min_order_amount > 0 && (
              <p className="text-muted-foreground">Pedido mínimo: ${store.min_order_amount}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
