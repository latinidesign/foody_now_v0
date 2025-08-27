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

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="relative">
        <ShoppingCart className="w-4 h-4 mr-2" />
        Carrito
        {state.itemCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {state.itemCount}
          </Badge>
        )}
      </Button>

      <CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
