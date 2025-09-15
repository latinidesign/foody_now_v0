"use client"

import type { Store } from "@/lib/types/database"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Phone, MapPin, Clock, Globe, Map } from "lucide-react"
import { LocationMap } from "./location-map"
import { BusinessHoursModal } from "./business-hours-modal"
import { useState } from "react"

interface StoreDrawerProps {
  store: Store & { business_hours?: any; is_open?: boolean }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function isStoreOpen(businessHours: any, isOpen = true) {
  if (!isOpen || !businessHours) return false

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const currentDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()]

  const daySchedule = businessHours[currentDay]
  if (!daySchedule || !daySchedule.isOpen) {
    return false
  }

  const checkPeriod = (openStr: string, closeStr: string) => {
    const open = timeToMinutes(openStr)
    const close = timeToMinutes(closeStr)
    const current = nowMinutes

    if (close < open) {
      return current >= open || current <= close
    }
    return current >= open && current <= close
  }

  if (daySchedule.open1 && daySchedule.close1) {
    if (checkPeriod(daySchedule.open1, daySchedule.close1)) {
      return true
    }
  }

  if (daySchedule.open2 && daySchedule.close2) {
    if (checkPeriod(daySchedule.open2, daySchedule.close2)) {
      return true
    }
  }

  return false
}

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}

function getNextScheduleInfo(businessHours: any, isOpen = true) {
  if (!isOpen || !businessHours) return null

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const currentDayIndex = now.getDay()
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

  const currentSchedule = businessHours[days[currentDayIndex]]

  if (currentSchedule?.isOpen) {
    const { open1, close1, open2, close2 } = currentSchedule

    if (open1 && close1) {
      const start = timeToMinutes(open1)
      const end = timeToMinutes(close1)
      if (nowMinutes >= start && nowMinutes <= end) {
        return `hasta las ${close1} hs`
      }
    }

    if (open2 && close2) {
      const start = timeToMinutes(open2)
      const end = timeToMinutes(close2)
      if (nowMinutes >= start && (end > start ? nowMinutes <= end : true)) {
        return `hasta las ${close2} hs`
      }
    }

    if (open1 && close1) {
      const start = timeToMinutes(open1)
      const end = timeToMinutes(close1)
      if (nowMinutes < start) {
        return `Abre hoy a las ${minutesToTime(start)}`
      }
      if (end <= start && nowMinutes > end) {
        return `Abre hoy a las ${minutesToTime(start)}`
      }
    }

    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7
      const nextSchedule = businessHours[days[nextDayIndex]]
      if (nextSchedule?.isOpen) {
        const dayName = i === 1 ? "mañana" : dayNames[nextDayIndex]
        return `Abre ${dayName} a las ${nextSchedule.open1}`
      }
    }
  }

  return null
}

export function StoreDrawer({ store, open, onOpenChange }: StoreDrawerProps) {
  const [showMap, setShowMap] = useState(false)
  const [showBusinessHours, setShowBusinessHours] = useState(false)

  const storeIsOpen = isStoreOpen(store.business_hours, store.is_open)
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
                  <div className={`text-sm font-medium mb-1 ${storeIsOpen ? "text-green-600" : "text-red-600"}`}>
                    {storeIsOpen ? <span>**Abierto** {nextScheduleInfo}</span> : "Cerrado"}
                  </div>
                  {!storeIsOpen && nextScheduleInfo && (
                    <p className="text-xs text-muted-foreground mb-2">{nextScheduleInfo}</p>
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
