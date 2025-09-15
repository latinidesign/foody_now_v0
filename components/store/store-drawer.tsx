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
      if (!daySchedule || !daySchedule.isOpen) {
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

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function isStoreOpen(businessHours: any, isOpen = true) {
  if (!isOpen || !businessHours) return false

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const currentDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][
    now.getDay()
  ]

  const daySchedule = businessHours[currentDay]
  if (!daySchedule || !daySchedule.isOpen) {
    return false
  }

  const checkPeriod = (openStr: string, closeStr: string) => {
    let open = timeToMinutes(openStr)
    let close = timeToMinutes(closeStr)
    let current = nowMinutes
    if (close <= open) {
      close += 1440
      if (current < open) current += 1440
    }
    return current >= open && current <= close
  }

  if (checkPeriod(daySchedule.open1, daySchedule.close1)) return true
  if (daySchedule.open2 && daySchedule.close2 && checkPeriod(daySchedule.open2, daySchedule.close2)) return true

  return false
}

function getNextScheduleInfo(businessHours: any, isOpen = true) {
  if (!businessHours) return null

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const currentDayIndex = now.getDay()
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  const daySchedule = businessHours[days[currentDayIndex]]

  const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24
    const m = mins % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  const periods = daySchedule?.isOpen
    ? [
        { open: daySchedule.open1, close: daySchedule.close1 },
        ...(daySchedule.open2 && daySchedule.close2
          ? [{ open: daySchedule.open2, close: daySchedule.close2 }]
          : []),
      ]
    : []

  const storeCurrentlyOpen = isStoreOpen(businessHours, isOpen)

  if (storeCurrentlyOpen) {
    for (const { open, close } of periods) {
      let start = timeToMinutes(open)
      let end = timeToMinutes(close)
      let current = nowMinutes
      if (end <= start) {
        end += 1440
        if (current < start) current += 1440
      }
      if (current >= start && current <= end) {
        return `Cierra a las ${minutesToTime(end % 1440)}`
      }
    }
  } else {
    for (const { open, close } of periods) {
      const start = timeToMinutes(open)
      const end = timeToMinutes(close)
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
                  <div className={`text-sm font-medium mb-1 ${storeIsOpen ? "text-green-600" : "text-red-600"}`}>
                    {storeIsOpen ? <span>Abierto {nextScheduleInfo && nextScheduleInfo}</span> : "Cerrado"}
                  </div>
                  {!storeIsOpen && nextScheduleInfo && (
                    <p className="text-xs text-muted-foreground mb-2">{nextScheduleInfo}</p>
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

      {store.address && (
        <LocationMap address={store.address} storeName={store.name} open={showMap} onOpenChange={setShowMap} />
      )}
    </>
  )
}
