"use client"

import { useState, useTransition } from "react"
import { AlertCircle, Check, X } from "lucide-react"
import { memo } from "react"

interface PricingRefactorBannerProps {
  storeId: string
  acknowledgedAt: string | null
}

export const PricingRefactorBanner = memo(function PricingRefactorBanner({
  storeId,
  acknowledgedAt,
}: PricingRefactorBannerProps) {
  const [isVisible, setIsVisible] = useState(acknowledgedAt === null)
  const [isPending, startTransition] = useTransition()

  if (!isVisible) {
    return null
  }

  const handleAcknowledge = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/pricing-refactor-ack", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeId }),
        })
        if (response.ok) {
          setIsVisible(false)
        }
      } catch (error) {
        // Silenciar error: el banner se puede cerrar de nuevo
        console.error("[pricing-refactor-banner] error al confirmar", error)
      }
    })
  }

  return (
    <div className="border-l-4 border-amber-400 bg-amber-50 p-4 mb-6 flex items-start justify-between rounded-lg gap-4">
      <div className="flex items-start gap-3 flex-1">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">
            Cambio en como se cargan los precios de opciones
          </p>
          <p className="text-sm text-amber-800 mt-1">
            A partir de ahora, el precio que pongas en cada variedad es el precio COMPLETO que paga
            el cliente si la elige (no un diferencial sobre el precio base del producto). Esto hace
            mas claro el menu para tus clientes, reduce errores al cargar el catalogo y evita
            confusion al calcular totales. Si ya tenias opciones cargadas, las convertimos
            automaticamente al nuevo formato.
          </p>
          <p className="text-sm text-amber-800 mt-2 font-medium">
            Te recomendamos revisar los precios de las variedades de tus productos para asegurarte
            de que los valores mostrados son los correctos.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleAcknowledge}
          disabled={isPending}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded text-sm font-semibold transition flex items-center gap-2 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {isPending ? "Guardando..." : "Entendido"}
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="text-amber-600 hover:text-amber-900 transition"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
})
