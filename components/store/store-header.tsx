"use client"

import type { Store } from "@/lib/types/database"
import { Menu, ArrowLeft } from "lucide-react"
import { CartButton } from "./cart-button"
import { StoreDrawer } from "./store-drawer"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface StoreHeaderProps {
  store: Store
  showBackButton?: boolean
}

export function StoreHeader({ store, showBackButton = false }: StoreHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <header className="bg-card border-b backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-3 leading-10">
          <div className="flex items-center justify-between">
            {/* Left: Menu hamburguesa o botón volver */}
            <div className="flex items-center">
              {showBackButton ? (
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Volver"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Abrir menú"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Center: Logo o nombre de la tienda */}
            <div className="flex items-center gap-2 flex-1 justify-center">
              {store.logo_url ? (
                <img
                  src={store.logo_url || "/placeholder.svg"}
                  alt={store.name}
                  className="rounded-full object-cover leading-10 md:w-36 md:h-20 w-36 h-20"
                />
              ) : (
                <h1 className="text-lg md:text-xl font-bold text-foreground text-center">{store.name}</h1>
              )}
            </div>

            {/* Right: Carrito de compras */}
            <div className="flex items-center">
              <CartButton />
            </div>
          </div>
        </div>

        {/* Header image section (opcional) */}
        {store.header_image_url && (
          <div className="relative h-32 md:h-48 overflow-hidden">
            <img
              src={store.header_image_url || "/placeholder.svg"}
              alt={store.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        )}
      </header>

      <StoreDrawer store={store} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
