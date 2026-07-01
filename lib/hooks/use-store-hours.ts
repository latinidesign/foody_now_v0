"use client"

import { useState, useEffect } from 'react'
import { calculateStoreStatus } from '@/lib/store-hours'

interface StoreHoursState {
  isOpen: boolean
  nextScheduleInfo: string | null
  isLoading: boolean
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
      setState(_prev => ({ ...status, isLoading: false }))
    }

    // Calcular inmediatamente
    updateStatus()

    // Actualizar cada minuto
    const interval = setInterval(updateStatus, 60000)

    return () => clearInterval(interval)
  }, [businessHours, storeIsOpen])

  return state
}
