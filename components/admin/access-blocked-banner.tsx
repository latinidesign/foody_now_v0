"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AlertCircle, Clock, Lock, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AccessBlockedBanner() {
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(false)
  
  const isBlocked = searchParams.get('blocked') === 'true'

  useEffect(() => {
    if (isBlocked) {
      setIsVisible(true)
    }
  }, [isBlocked])

  if (!isVisible) return null

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg flex items-start gap-4 justify-between">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900 mb-1">
            🔒 Acceso a la Plataforma Bloqueado
          </h3>
          <p className="text-sm text-red-700">
            Intentaste acceder a una página que requiere una suscripción activa. Tu suscripción ha vencido o está inactiva. 
            <strong> Selecciona un plan abajo para renovar tu acceso.</strong>
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(false)}
        className="flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
