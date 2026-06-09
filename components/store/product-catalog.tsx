"use client"

import type { Store, Category, Product } from "@/lib/types/database"
import { useState } from "react"
import { ProductCard } from "./product-card"
import { Search } from "lucide-react"

interface ProductCatalogProps {
  store: Store
  categories: (Category & { products: Product[] })[]
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" fill="currentColor" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" fill="currentColor" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" fill="currentColor" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" fill="currentColor" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4.5" width="5" height="5" rx="1.4" fill="currentColor" />
      <rect x="3" y="14.5" width="5" height="5" rx="1.4" fill="currentColor" />
      <path d="M11 7h10M11 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function ProductCatalog({ store, categories }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredProducts = categories.flatMap((category) => {
    if (selectedCategory && category.id !== selectedCategory) return []
    return category.products.filter((product) => {
      if (!product.is_available) return false
      if (
        searchQuery &&
        !(product.name + " " + (product.description || ""))
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
        return false
      return true
    })
  })

  const count = filteredProducts.length
  const showCategoryTabs = categories.length > 1

  return (
    <div>
      {/* Controls */}
      <div className="bg-background px-3.5 md:px-7 pt-3.5 md:pt-5 max-w-[1200px] mx-auto w-full">
        {/* Search */}
        <div className="flex items-center gap-2.5 bg-card border border-border rounded-full px-4 h-[46px] shadow-sm">
          <Search className="text-muted-foreground flex-shrink-0 w-[18px] h-[18px]" />
          <input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 outline-none bg-transparent flex-1 text-[15px] text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-3 gap-3">
          <span className="text-[13px] text-muted-foreground">
            <b className="text-foreground font-bold">{count}</b>{" "}
            {count === 1 ? "producto" : "productos"}
          </span>
          <div className="inline-flex bg-muted rounded-full p-[3px] gap-0.5">
            <button
              className={`rounded-full w-10 h-8 flex items-center justify-center transition-all duration-150 border-0 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#80c519] text-[#16161b] shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("grid")}
              aria-label="Vista grilla"
            >
              <GridIcon />
            </button>
            <button
              className={`rounded-full w-10 h-8 flex items-center justify-center transition-all duration-150 border-0 cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#80c519] text-[#16161b] shadow-sm"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("list")}
              aria-label="Vista lista"
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        {showCategoryTabs && (
          <div
            className="flex gap-2 overflow-x-auto mt-3.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              className={`flex-shrink-0 border rounded-full px-[18px] py-[9px] text-sm font-semibold whitespace-nowrap cursor-pointer transition-all duration-150 ${
                selectedCategory === null
                  ? "bg-[#80c519] border-[#80c519] text-[#16161b] font-bold"
                  : "bg-card border-border text-foreground hover:border-[#80c519]"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`flex-shrink-0 border rounded-full px-[18px] py-[9px] text-sm font-semibold whitespace-nowrap cursor-pointer transition-all duration-150 ${
                  selectedCategory === category.id
                    ? "bg-[#80c519] border-[#80c519] text-[#16161b] font-bold"
                    : "bg-card border-border text-foreground hover:border-[#80c519]"
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="px-3.5 md:px-7 pt-2.5 pb-12 max-w-[1200px] mx-auto w-full">
        {filteredProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-[15px]">
            {searchQuery
              ? "No encontramos productos para tu búsqueda."
              : "No hay productos disponibles."}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-[18px]">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode="grid"
                storeSlug={store.slug}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 md:gap-3.5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode="list"
                storeSlug={store.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
