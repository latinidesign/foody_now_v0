"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"

interface SubscriptionGuardProps {
  children: React.ReactNode
  storeId: string | null
}

export function SubscriptionGuard({ children, storeId }: SubscriptionGuardProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const checkSubscription = async () => {
      // Rutas que permiten acceso sin suscripción activa
      const allowedPathsWithoutSubscription = [
        '/onboarding',
        '/admin/subscription',
        '/admin/profile',
        '/store-settings'
      ]

      // Verificar si la ruta actual está permitida sin suscripción
      const isAllowedPath = allowedPathsWithoutSubscription.some(path => 
        pathname.startsWith(path)
      )

      // Si está en una ruta permitida, dejar pasar
      if (isAllowedPath) {
        setIsAllowed(true)
        setIsChecking(false)
        return
      }

      // Si no tiene tienda, no puede acceder
      if (!storeId) {
        router.push('/onboarding')
        return
      }

      // Verificar suscripción
      const supabase = createClient()
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      // Obtener usuario para verificar período de prueba de 14 días
      const { data: { user } } = await supabase.auth.getUser()
      
      // Verificar si está dentro del período de prueba de 14 días
      const isWithinTrialPeriod = user?.created_at ? 
        (Date.now() - new Date(user.created_at).getTime()) < (14 * 24 * 60 * 60 * 1000) 
        : false

      // Estados válidos de suscripción
      const validStatuses = ['trial', 'active']
      const hasValidSubscription = subscription && validStatuses.includes(subscription.status)

      // Permitir acceso si:
      // 1. Tiene suscripción válida, O
      // 2. Está dentro del período de prueba de 14 días
      if (!hasValidSubscription && !isWithinTrialPeriod) {
        // Agregar parámetro de query para mostrar motivo del bloqueo
        router.push('/admin/subscription?blocked=true')
        setShowAlert(true)
      } else {
        setIsAllowed(true)
      }

      setIsChecking(false)
    }

    checkSubscription()
  }, [pathname, storeId, router])

  // Mientras verifica, mostrar loading
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Si no está permitido, no renderizar nada (ya redirigió)
  if (!isAllowed) {
    return null
  }

  // Si está permitido, renderizar children
  return <>{children}</>
}
