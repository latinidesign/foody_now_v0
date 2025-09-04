"use client"

import type { Store } from "@/lib/types/database"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Phone, MapPin, Clock, Globe, Map } from "lucide-react"
import { LocationMap } from "./location-map"
import { useState } from "react"

interface StoreDrawerProps {
  store: Store
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoreDrawer({ store, open, onOpenChange }: StoreDrawerProps) {
  const [showMap, setShowMap] = useState(false)

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-80">
          <SheetHeader className="text-left">
            <div className="flex gap-3 mb-4 flex-col items-center">
              {store.logo_url && (
                <img
                  src={store.logo_url || "/placeholder.svg"}
                  alt={store.name}
                  className="rounded-full object-cover w-40 h-24 items-start"
                />
              )}
              <div>
                <SheetTitle className="text-xl">{store.name}</SheetTitle>
                {store.description && <p className="text-sm text-muted-foreground mt-1">{store.description}</p>}
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {/* Información de contacto */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Información de Contacto
              </h3>

              {store.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <a
                      href={`tel:${store.phone}`}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {store.phone}
                    </a>
                  </div>
                </div>
              )}

              {store.address && (
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Dirección</p>
                    <p className="text-sm text-muted-foreground">{store.address}</p>
                  </div>
                  <button
                    onClick={() => setShowMap(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                  >
                    <Map className="w-3 h-3" />
                    Ver Mapa
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Estado</p>
                  <p className="text-sm text-primary font-medium">Abierto ahora</p>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            {store.website && (
              <div className="pt-4 border-t">
                <a
                  href={store.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Sitio Web</p>
                    <p className="text-sm text-muted-foreground">Visitar página oficial</p>
                  </div>
                </a>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {store.address && (
        <LocationMap address={store.address} storeName={store.name} open={showMap} onOpenChange={setShowMap} />
      )}
    </>
  )
}
