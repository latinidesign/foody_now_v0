"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { useCart } from "./cart-context"
import { CartDrawer } from "./cart-drawer"
import { useState } from "react"

export function CartButton() {
  const { state } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  const packItemCount = state.items.reduce((sum, item) => {
    const isUnitOnly =
      item.pricing_snapshot?.config?.mode === "unit_only" &&
      typeof item.pricing_snapshot.config.quantity === "number" &&
      item.pricing_snapshot.config.quantity > 0
    // Para unit_only, item.quantity ya esta expresado en packs.
    // Para los demas casos, item.quantity es la cantidad directa.
    return sum + item.quantity
  }, 0)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="relative">
        <ShoppingCart className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Pedido</span>
        {packItemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {packItemCount}
          </Badge>
        )}
      </Button>

      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
