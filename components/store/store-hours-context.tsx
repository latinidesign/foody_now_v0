"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useStoreHours } from "@/lib/hooks/use-store-hours"
import { isStoreConfigured } from "@/lib/store-hours"

interface StoreHoursContextValue {
  isOpen: boolean | null
  scheduleInfo: string | null
  isConfigured: boolean
  isLoading: boolean
}

const StoreHoursContext = createContext<StoreHoursContextValue | null>(null)

export function StoreHoursProvider({
  businessHours,
  isOpen: storeIsOpen,
  children,
}: {
  businessHours: any
  isOpen: boolean
  children: ReactNode
}) {
  const { isOpen, nextScheduleInfo, isLoading } = useStoreHours(businessHours, storeIsOpen)
  const configured = isStoreConfigured(businessHours ?? null)

  return (
    <StoreHoursContext.Provider
      value={{
        isOpen: isLoading ? null : isOpen,
        scheduleInfo: nextScheduleInfo,
        isConfigured: configured,
        isLoading,
      }}
    >
      {children}
    </StoreHoursContext.Provider>
  )
}

export function useStoreStatus() {
  const context = useContext(StoreHoursContext)
  if (!context) {
    throw new Error("useStoreStatus must be used within a StoreHoursProvider")
  }
  return context
}
