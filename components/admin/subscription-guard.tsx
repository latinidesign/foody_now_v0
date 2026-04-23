"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { getBrowserClient } from "@/lib/supabase/client"
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
  const [mounted, setMounted] = useState(false)
  const [subscriptionCache, setSubscriptionCache] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

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

      // Check cache
      if (subscriptionCache[storeId] !== undefined) {
        setIsAllowed(subscriptionCache[storeId])
        setIsChecking(false)
        return
      }

      // verificar suscripción o trial
      const supabase = getBrowserClient()

      // Obtener store para leer trial_ends_at
      const { data: store } = await supabase
        .from("stores")
        .select("trial_ends_at")
        .eq("id", storeId)
        .maybeSingle()

      // Obtener suscripción más reciente
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("paid_ends_at")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const now = new Date()

      // Verificar trial
      const trialEndsAt = store?.trial_ends_at ? new Date(store.trial_ends_at) : null
      const trialActive = trialEndsAt ? trialEndsAt > now : false

      // Verificar suscripción
      let hasValidSubscription = false

      if (subscription?.paid_ends_at) {
        const paidEndsAt = new Date(subscription.paid_ends_at)
        hasValidSubscription = paidEndsAt > now
      }

      // Permitir acceso si:
      // 1. trial activo
      // 2. suscripción válida
      const canAccess = trialActive || hasValidSubscription

      if (!canAccess) {
        router.push('/admin/subscription?blocked=true')
        setShowAlert(true)
        setSubscriptionCache(prev => ({ ...prev, [storeId]: false }))
      } else {
        setIsAllowed(true)
        setSubscriptionCache(prev => ({ ...prev, [storeId]: true }))
      }

      setIsChecking(false)
    }

    checkSubscription()
  }, [pathname, storeId, router, mounted])

  // Mientras verifica o no está montado, mostrar loading
  if (isChecking || !mounted) {
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
