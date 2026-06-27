function timeToMinutes(t: string) {
  if (!t || typeof t !== "string") return 0
  const [h, m] = t.split(":").map(Number)
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

export interface StoreHoursStatus {
  isOpen: boolean
  nextScheduleInfo: string | null
}

export function calculateStoreStatus(
  businessHours: Record<string, any> | null | undefined,
  storeIsOpen = true,
  timezone = "America/Argentina/Buenos_Aires",
): StoreHoursStatus {
  if (!storeIsOpen || !businessHours) {
    return { isOpen: false, nextScheduleInfo: null }
  }

  try {
    const now = new Date()
    const localeTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }))
    const nowMinutes = localeTime.getHours() * 60 + localeTime.getMinutes()
    const currentDayIndex = localeTime.getDay()
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

    const currentSchedule = businessHours[days[currentDayIndex]]

    let isCurrentlyOpen = false
    let nextInfo: string | null = null

    if (currentSchedule?.isOpen) {
      const { open1, close1, open2, close2 } = currentSchedule

      const checkPeriod = (openStr: string, closeStr: string) => {
        if (!openStr || !closeStr) return false
        const open = timeToMinutes(openStr)
        const close = timeToMinutes(closeStr)

        if (close < open) {
          return nowMinutes >= open || nowMinutes <= close
        }
        return nowMinutes >= open && nowMinutes <= close
      }

      if (open1 && close1 && checkPeriod(open1, close1)) {
        isCurrentlyOpen = true
        nextInfo = `hasta las ${close1} hs`
      }

      if (!isCurrentlyOpen && open2 && close2 && checkPeriod(open2, close2)) {
        isCurrentlyOpen = true
        nextInfo = `hasta las ${close2} hs`
      }

      if (!isCurrentlyOpen) {
        if (open1 && nowMinutes < timeToMinutes(open1)) {
          nextInfo = `Abre hoy a las ${open1} hs`
        } else if (open2 && nowMinutes < timeToMinutes(open2) && (!close1 || nowMinutes > timeToMinutes(close1))) {
          nextInfo = `Abre hoy a las ${open2} hs`
        }
      }
    }

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
    console.error("Error calculating store status:", error)
    return { isOpen: false, nextScheduleInfo: null }
  }
}

export function isStoreConfigured(businessHours: Record<string, any> | null | undefined): boolean {
  if (!businessHours) return false
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  return days.some((day) => businessHours[day]?.isOpen === true)
}
