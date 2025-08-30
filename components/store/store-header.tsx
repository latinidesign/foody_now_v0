import type { Store } from "@/lib/types/database"
import { Phone, MapPin, Clock } from "lucide-react"
import { CartButton } from "./cart-button"

interface StoreHeaderProps {
  store: Store
}

export function StoreHeader({ store }: StoreHeaderProps) {
  return (
    <header className="bg-card border-b sticky top-0 z-40 backdrop-blur-sm bg-card/95">
      {/* Hero Section */}
      {store.header_image_url && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src={store.header_image_url || "/placeholder.svg"}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-2xl md:text-3xl font-bold">{store.name}</h1>
            {store.description && <p className="text-sm md:text-base opacity-90 mt-1">{store.description}</p>}
          </div>
        </div>
      )}

      {/* Store Info Bar */}
      <div className="bg-card px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {store.logo_url && (
                <img
                  src={store.logo_url || "/placeholder.svg"}
                  alt={store.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <h1 className="text-lg font-bold text-foreground">{store.name}</h1>
            </div>

            {store.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <span>{store.phone}</span>
              </div>
            )}

            {store.address && (
              <div className="hidden md:flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{store.address}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span className="text-primary font-medium">Abierto</span>
            </div>
          </div>

          <CartButton />
        </div>
      </div>
    </header>
  )
}
