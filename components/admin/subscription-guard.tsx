"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface SubscriptionGuardProps {
  children: React.ReactNode
  storeId: string | null
}

export function SubscriptionGuard({ children, storeId }: SubscriptionGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    const checkSubscription = async () => {
      // Rutas que permiten acceso sin suscripción activa
      const allowedPathsWithoutSubscription = [
        '/admin/setup',
        '/admin/renew',
        '/admin/subscription',
        '/admin/profile'
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

      // Si no tiene tienda, no puede acceder (esto no debería pasar)
      if (!storeId) {
        router.push('/admin/setup')
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

      // Estados válidos de suscripción
      const validStatuses = ['trial', 'active']
      const hasValidSubscription = subscription && validStatuses.includes(subscription.status)

      if (!hasValidSubscription) {
        // Redirigir a setup si nunca tuvo suscripción, o a renew si la tuvo
        const hasHadSubscription = subscription !== null
        
        if (hasHadSubscription) {
          router.push('/admin/renew')
        } else {
          router.push('/admin/setup')
        }
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
