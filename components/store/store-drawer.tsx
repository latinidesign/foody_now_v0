"use client"

import type { Store } from "@/lib/types/database"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Phone, MapPin, Clock, Globe, Map, Info } from "lucide-react"
import { LocationMap } from "./location-map"
import { useState } from "react"
import Link from "next/link"

interface StoreDrawerProps {
  store: Store & { business_hours?: any; is_open?: boolean }
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatBusinessHours(businessHours: any) {
  if (!businessHours) return "Horarios no configurados"

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

  return days
    .map((day, index) => {
      const daySchedule = businessHours[day]
      if (!daySchedule || !daySchedule.enabled) {
        return `${dayNames[index]}: Cerrado`
      }

      let schedule = `${dayNames[index]}: ${daySchedule.open1} - ${daySchedule.close1}`
      if (daySchedule.open2 && daySchedule.close2) {
        schedule += ` y ${daySchedule.open2} - ${daySchedule.close2}`
      }
      return schedule
    })
    .join("\n")
}

function isStoreOpen(businessHours: any, isOpen = true) {
  if (!isOpen || !businessHours) return false

  const now = new Date()
  const currentDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()]
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

  const daySchedule = businessHours[currentDay]
  if (!daySchedule || !daySchedule.enabled) return false

  const isInFirstPeriod = currentTime >= daySchedule.open1 && currentTime <= daySchedule.close1
  const isInSecondPeriod =
    daySchedule.open2 && daySchedule.close2 && currentTime >= daySchedule.open2 && currentTime <= daySchedule.close2

  return isInFirstPeriod || isInSecondPeriod
}

function getNextScheduleInfo(businessHours: any, isOpen = true) {
  if (!isOpen || !businessHours) return null

  const now = new Date()
  const currentDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()]
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM format

  const daySchedule = businessHours[currentDay]

  if (!daySchedule || !daySchedule.enabled) {
    // Buscar próximo día abierto
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (now.getDay() + i) % 7
      const nextDay = days[nextDayIndex]
      const nextDaySchedule = businessHours[nextDay]

      if (nextDaySchedule && nextDaySchedule.enabled) {
        const dayName = i === 1 ? "mañana" : dayNames[nextDayIndex]
        return `Abre ${dayName} a las ${nextDaySchedule.open1}`
      }
    }
    return null
  }

  // Si está abierto, mostrar cuándo cierra
  const isInFirstPeriod = currentTime >= daySchedule.open1 && currentTime <= daySchedule.close1
  const isInSecondPeriod =
    daySchedule.open2 && daySchedule.close2 && currentTime >= daySchedule.open2 && currentTime <= daySchedule.close2

  if (isInFirstPeriod) {
    return `Cierra a las ${daySchedule.close1}`
  } else if (isInSecondPeriod) {
    return `Cierra a las ${daySchedule.close2}`
  } else if (daySchedule.open2 && currentTime < daySchedule.open2 && currentTime > daySchedule.close1) {
    return `Abre a las ${daySchedule.open2}`
  } else if (currentTime < daySchedule.open1) {
    return `Abre a las ${daySchedule.open1}`
  }

  return null
}

export function StoreDrawer({ store, open, onOpenChange }: StoreDrawerProps) {
  const [showMap, setShowMap] = useState(false)

  const storeIsOpen = isStoreOpen(store.business_hours, store.is_open)
  const formattedHours = formatBusinessHours(store.business_hours)
  const nextScheduleInfo = getNextScheduleInfo(store.business_hours, store.is_open)

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

          <div className="space-y-4 mt-4 px-4 py-4">
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

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Horarios de Atención</p>
                  <p className={`text-sm font-medium mb-1 ${storeIsOpen ? "text-green-600" : "text-red-600"}`}>
                    {storeIsOpen ? "Abierto ahora" : "Cerrado"}
                  </p>
                  {nextScheduleInfo && <p className="text-xs text-muted-foreground mb-2">{nextScheduleInfo}</p>}
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

            {/* Agregando enlace a página Quiénes Somos */}
            <div className="space-y-3">
              <Link
                href={`/store/${store.slug}/about`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Info className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Quiénes Somos</p>
                  <p className="text-sm text-muted-foreground">Conoce más sobre nosotros</p>
                </div>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {store.address && (
        <LocationMap address={store.address} storeName={store.name} open={showMap} onOpenChange={setShowMap} />
      )}
    </>
  )
}
