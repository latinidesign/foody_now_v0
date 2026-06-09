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
      {/* Sticky nav bar */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-3.5 md:px-7 py-2.5 md:py-3.5">
          {/* Left */}
          <div className="flex items-center">
            {showBackButton ? (
              <button
                onClick={() => router.back()}
                className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center border border-border bg-card rounded-xl hover:bg-muted transition-colors cursor-pointer"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center border border-border bg-card rounded-xl hover:bg-muted transition-colors cursor-pointer"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Center: logo or store name */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-12 md:h-16 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <h1 className="text-lg md:text-xl font-bold text-foreground text-center leading-tight">
                {store.name}
              </h1>
            )}
          </div>

          {/* Right: cart */}
          <div className="flex items-center">
            <CartButton />
          </div>
        </div>
      </header>

      {/* Hero banner (only when header image is set) */}
      {store.header_image_url && (
        <div className="relative overflow-hidden bg-neutral-900 h-[150px] md:h-[220px] flex items-end">
          <img
            src={store.header_image_url}
            alt={store.name}
            className="absolute inset-0 w-full h-full object-cover opacity-55"
          />
          {/* Gradient overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="relative z-10 text-white px-4 md:px-10 py-4 md:py-8">
            {store.description && (
              <div className="text-[11px] md:text-[13px] font-bold uppercase tracking-[0.08em] text-[#b3db66] mb-1 md:mb-2">
                {store.description.length > 40
                  ? store.description.slice(0, 40) + "…"
                  : store.description}
              </div>
            )}
            <h2 className="font-heading font-extrabold text-[22px] md:text-[40px] leading-none text-white max-w-[16ch] md:max-w-[18ch]">
              {store.name}
            </h2>
          </div>
        </div>
      )}

      <StoreDrawer store={store} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  )
}
