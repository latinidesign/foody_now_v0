"use client"

import type { Store } from "@/lib/types/database"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Phone, MapPin, Clock, Globe, Map, Info } from "lucide-react"
import { LocationMap } from "./location-map"
import { BusinessHoursModal } from "./business-hours-modal"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { combineStorePath, deriveStoreBasePathFromPathname } from "@/lib/store/path"
import { useStoreHours } from "@/lib/hooks/use-store-hours"

interface StoreDrawerProps {
  store: Store & { business_hours?: any; is_open?: boolean }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoreDrawer({ store, open, onOpenChange }: StoreDrawerProps) {
  const [showMap, setShowMap] = useState(false)
  const [showBusinessHours, setShowBusinessHours] = useState(false)
  const storeBasePath = deriveStoreBasePathFromPathname(usePathname(), store.slug)

  const { isOpen: storeIsOpen, nextScheduleInfo, isLoading } = useStoreHours(
    store.business_hours, 
    store.is_open
  )

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-80 bg-white">
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

          <div className="space-y-4 mt-4 px-4 py-4 bg-slate-100">
            {/* Información de contacto */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Información de Contacto
              </h3>

              <Link
                href={combineStorePath(storeBasePath, "/about")}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/20 transition-colors bg-neutral-200"
              >
                <Info className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Quiénes Somos</p>
                  <p className="text-sm text-muted-foreground">Conoce más sobre nosotros</p>
                </div>
              </Link>

              {store.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <a href={`tel:${store.phone}`} className="text-sm text-primary hover:underline">
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

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Horarios de Atención</p>
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground mb-1">Verificando horarios...</div>
                  ) : (
                    <>
                      <div className={`text-sm font-medium mb-1 ${storeIsOpen ? "text-green-600" : "text-red-600"}`}>
                        {storeIsOpen ? (
                          <span>🟢 Abierto {nextScheduleInfo || ''}</span>
                        ) : (
                          <span>🔴 Cerrado</span>
                        )}
                      </div>
                      {!storeIsOpen && nextScheduleInfo && (
                        <p className="text-xs text-muted-foreground mb-2">{nextScheduleInfo}</p>
                      )}
                    </>
                  )}
                  {store.business_hours && (
                    <button onClick={() => setShowBusinessHours(true)} className="text-xs text-primary underline">
                      Ver horario completo
                    </button>
                  )}
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

      {store.business_hours && (
        <BusinessHoursModal
          businessHours={store.business_hours}
          storeName={store.name}
          open={showBusinessHours}
          onOpenChange={setShowBusinessHours}
        />
      )}

      {store.address && (
        <LocationMap address={store.address} storeName={store.name} open={showMap} onOpenChange={setShowMap} />
      )}
    </>
  )
}
