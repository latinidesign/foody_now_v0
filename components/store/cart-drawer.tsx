"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useCart } from "./cart-context"
import { Minus, Plus, Trash2 } from "lucide-react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { combineStorePath, deriveStoreBasePathFromPathname } from "@/lib/store/path"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { state, updateQuantity, removeItem, clearCart } = useCart()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const slugParam = params.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  const storeBasePath = slug
    ? deriveStoreBasePathFromPathname(pathname, slug)
    : "/"

  const handleCheckout = () => {
    if (state.items.length === 0 || !slug) return

    router.push(combineStorePath(storeBasePath, "/checkout"))
    onClose()
  }

  const getPackInfo = (item: any) => {
    const config = item.pricing_snapshot?.config
    if (config?.mode === "unit_only" && typeof config.quantity === "number" && config.quantity > 0) {
      // Para unit_only, item.quantity es packs (no piezas). Multiplicamos por
      // packSize para mostrar la cantidad de piezas equivalentes.
      return { packs: item.quantity, pieces: item.quantity * config.quantity }
    }
    return null
  }

  const renderQuantityLabel = (item: any) => {
    const packInfo = getPackInfo(item)
    if (packInfo !== null) {
      return `Cantidad: ${packInfo.packs} pack${packInfo.packs === 1 ? "" : "s"} (${packInfo.pieces} unidad${packInfo.pieces === 1 ? "" : "es"})`
    }
    return `Cantidad: ${item.quantity}`
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tu Pedido</SheetTitle>
          <SheetDescription>
            {state.itemCount} {state.itemCount === 1 ? "producto" : "productos"} en tu carrito
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {state.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Tu pedido está vacío</p>
                <Button onClick={onClose} variant="outline">
                  Continuar Comprando
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4 px-4">
                <div className="space-y-4">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      {item.image_url && (
                        <img
                          src={item.image_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                        <p className="text-primary font-semibold">
                          ${item.total_price != null ? item.total_price.toFixed(2) : (item.price * item.quantity).toFixed(2)}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium">{renderQuantityLabel(item)}</span>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t space-y-4 px-4 py-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg text-primary">${state.total.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Button onClick={handleCheckout} className="w-full" size="lg">
                    Continuar con el Pedido
                  </Button>
                  <Button onClick={clearCart} variant="outline" className="w-full bg-transparent">
                    Vaciar Carrito
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
