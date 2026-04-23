"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getBrowserClient } from "@/lib/supabase/client"
import { StoreOnboardingForm } from "@/components/admin/store-onboarding-form"
import { AuthHeader } from "@/components/auth/auth-header"

export default function AdminSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        if (mounted) {
          router.replace("/auth/login")
        }
        return
      }

      setIsAuthenticated(true)

      const { data: storeData } = await supabase
        .from("stores")
        .select("id, is_onboarded, slug, created_at, name, description, phone, email")
        .eq("owner_id", user.id)
        .maybeSingle()

      if (!mounted) return

      // Si completó onboarding → ir al admin general
      if (storeData?.is_onboarded) {
        router.replace("/admin")
        return
      }

      // Si NO está onboarded o no existe → mostrar formulario de onboarding
      setStore(storeData ?? null)
      setLoading(false)
    }

    checkAuth()

    return () => {
      mounted = false
    }
  }, [router])

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">
              {store ? "Completar configuración" : "Crear tu tienda"}
            </h1>
            <p className="text-muted-foreground">
              {store
                ? "Completa los detalles básicos de tu tienda para continuar"
                : "Configura tu tienda para comenzar a recibir pedidos"}
            </p>
          </div>

          <StoreOnboardingForm store={store} />
        </div>
      </div>
    </div>
  )
}
