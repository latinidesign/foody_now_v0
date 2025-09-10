"use client"

import { Clock } from "lucide-react"
import { BusinessHoursModal } from "@/components/store/business-hours-modal"
import { useState } from "react"

interface BusinessHoursSectionProps {
  store: any
}

export function BusinessHoursSection({ store }: BusinessHoursSectionProps) {
  const [showHours, setShowHours] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-primary" />
        <button onClick={() => setShowHours(true)} className="text-primary hover:underline">
          Consultar horarios de atención
        </button>
      </div>

      <BusinessHoursModal
        businessHours={store.business_hours}
        storeName={store.name}
        open={showHours}
        onOpenChange={setShowHours}
      />
    </>
  )
}
