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
