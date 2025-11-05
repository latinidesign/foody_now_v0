"use client"

import { useState, useEffect } from 'react'

interface StoreHoursState {
  isOpen: boolean
  nextScheduleInfo: string | null
  isLoading: boolean
}

const timeToMinutes = (t: string) => {
  if (!t || typeof t !== 'string') return 0
  const [h, m] = t.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

function calculateStoreStatus(businessHours: any, storeIsOpen = true): Omit<StoreHoursState, 'isLoading'> {
  if (!storeIsOpen || !businessHours) {
    return { isOpen: false, nextScheduleInfo: null }
  }

  try {
    // Usar zona horaria de Argentina por defecto
    const now = new Date()
    const argTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }))
    const nowMinutes = argTime.getHours() * 60 + argTime.getMinutes()
    const currentDayIndex = argTime.getDay()
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

    const currentSchedule = businessHours[days[currentDayIndex]]

    // Verificar si está abierto ahora
    let isCurrentlyOpen = false
    let nextInfo = null

    if (currentSchedule?.isOpen) {
      const { open1, close1, open2, close2 } = currentSchedule

      const checkPeriod = (openStr: string, closeStr: string) => {
        if (!openStr || !closeStr) return false
        const open = timeToMinutes(openStr)
        const close = timeToMinutes(closeStr)

        if (close < open) {
          // Horario nocturno que cruza medianoche
          return nowMinutes >= open || nowMinutes <= close
        }
        return nowMinutes >= open && nowMinutes <= close
      }

      // Verificar primer período
      if (open1 && close1 && checkPeriod(open1, close1)) {
        isCurrentlyOpen = true
        nextInfo = `hasta las ${close1} hs`
      }

      // Verificar segundo período
      if (!isCurrentlyOpen && open2 && close2 && checkPeriod(open2, close2)) {
        isCurrentlyOpen = true
        nextInfo = `hasta las ${close2} hs`
      }

      // Si no está abierto, ver cuándo abre hoy
      if (!isCurrentlyOpen) {
        if (open1 && nowMinutes < timeToMinutes(open1)) {
          nextInfo = `Abre hoy a las ${open1} hs`
        } else if (open2 && nowMinutes < timeToMinutes(open2) && (!close1 || nowMinutes > timeToMinutes(close1))) {
          nextInfo = `Abre hoy a las ${open2} hs`
        }
      }
    }

    // Si no está abierto hoy, buscar el próximo día
    if (!isCurrentlyOpen && !nextInfo) {
      for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7
        const nextSchedule = businessHours[days[nextDayIndex]]
        if (nextSchedule?.isOpen && nextSchedule.open1) {
          const dayName = i === 1 ? "mañana" : dayNames[nextDayIndex]
          nextInfo = `Abre ${dayName} a las ${nextSchedule.open1} hs`
          break
        }
      }
    }

    return { isOpen: isCurrentlyOpen, nextScheduleInfo: nextInfo }
  } catch (error) {
    console.error('Error calculating store status:', error)
    return { isOpen: false, nextScheduleInfo: null }
  }
}

export function useStoreHours(businessHours: any, storeIsOpen = true): StoreHoursState {
  const [state, setState] = useState<StoreHoursState>({
    isOpen: false,
    nextScheduleInfo: null,
    isLoading: true
  })

  useEffect(() => {
    const updateStatus = () => {
      const status = calculateStoreStatus(businessHours, storeIsOpen)
      setState(prev => ({ ...status, isLoading: false }))
    }

    // Calcular inmediatamente
    updateStatus()

    // Actualizar cada minuto
    const interval = setInterval(updateStatus, 60000)

    return () => clearInterval(interval)
  }, [businessHours, storeIsOpen])

  return state
}
