import type { Store } from "@/lib/types/database"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Phone, MapPin, Clock, Globe } from "lucide-react"

interface StoreDrawerProps {
  store: Store
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StoreDrawer({ store, open, onOpenChange }: StoreDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-3 mb-4">
            {store.logo_url && (
              <img
                src={store.logo_url || "/placeholder.svg"}
                alt={store.name}
                className="w-12 h-12 rounded-full object-cover"
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
                <div>
                  <p className="font-medium">Dirección</p>
                  <p className="text-sm text-muted-foreground">{store.address}</p>
                </div>
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
  )
}
