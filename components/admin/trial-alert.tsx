"use client"

import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, X, Zap } from "lucide-react"
import Link from "next/link"

interface TrialAlertProps {
  trialEndsAt: string
}

export function TrialAlert({ trialEndsAt }: TrialAlertProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const calculateDaysLeft = () => {
      const trialEndsAtDate = new Date(trialEndsAt)
      const now = new Date()
      console.log("Calculando días restantes:", { trialEndsAtDate, now })
      const remaining = Math.ceil((trialEndsAtDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      console.log("Días restantes calculados:", remaining)
      setDaysLeft(remaining)
    }

    calculateDaysLeft()
    const interval = setInterval(calculateDaysLeft, 60000) // Actualizar cada minuto

    return () => clearInterval(interval)
  }, [trialEndsAt])

  if (daysLeft === null || daysLeft <= 0 || !isVisible) {
    return null
  }

  // Mostrar alerta más prominente si quedan 3 días o menos
  const isUrgent = daysLeft <= 3

  return (
    <div className={`border-l-4 p-4 mb-6 flex items-center justify-between rounded-lg transition ${
      isUrgent 
        ? 'bg-red-50 border-red-400' 
        : 'bg-amber-50 border-amber-400'
    }`}>
      <div className="flex items-center gap-3 flex-1">
        {isUrgent ? (
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        )}
        <div>
          <p className={`font-semibold ${isUrgent ? 'text-red-900' : 'text-amber-900'}`}>
            {isUrgent ? (
              <>⚠️ ¡Te quedan <strong>{daysLeft}</strong> días de prueba!</>
            ) : (
              <>✨ Te quedan <strong>{daysLeft}</strong> días de prueba</>
            )}
          </p>
          <p className={`text-sm ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
            {isUrgent 
              ? 'Suscribite ahora para no perder acceso a tu tienda cuando termine el período de prueba'
              : 'Suscribite ahora para no perder acceso a tu tienda'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/admin/subscription"
          className={`${
            isUrgent
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-amber-600 hover:bg-amber-700'
          } text-white px-4 py-2 rounded text-sm font-semibold transition flex items-center gap-2`}
        >
          <Zap className="h-4 w-4" />
          Suscribite ahora
        </Link>
        <button
          onClick={() => setIsVisible(false)}
          className={`${isUrgent ? 'text-red-600 hover:text-red-900' : 'text-amber-600 hover:text-amber-900'} transition`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
