"use client"

import { useStoreStatus } from "./store-hours-context"

export function StoreHoursBanner() {
  const { isOpen, scheduleInfo, isConfigured, isLoading } = useStoreStatus()

  if (isLoading) return null

  if (!isConfigured) {
    return (
      <div className="mx-3.5 md:mx-7 mt-4 mb-2">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 text-sm font-medium">
            La tienda todav&iacute;a est&aacute; organizando sus horarios de atenci&oacute;n. Vuelve pronto
            para m&aacute;s novedades.
          </p>
        </div>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="mx-3.5 md:mx-7 mt-4 mb-2">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm font-medium">
            La tienda est&aacute; cerrada en este momento.
            {scheduleInfo && ` ${scheduleInfo}.`}
          </p>
        </div>
      </div>
    )
  }

  return null
}
