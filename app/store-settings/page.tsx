"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { StoreSettingsForm } from "@/components/admin/store-settings-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Store, StoreSettings } from "@/lib/types/database"

export default function StoreSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<Store | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [mp, setMp] = useState("")
  const [mpAccountId, setMpAccountId] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    const loadStore = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/auth/login")
        return
      }

      try {
        // Cargar datos de la tienda
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("owner_id", user.id)
          .single()

        if (storeError || !storeData) {
          if (mounted) {
            setError("No se encontró tu tienda. Por favor completa el onboarding primero.")
          }
          return
        }

        // Cargar configuración de tienda
        const { data: settingsData } = await supabase
          .from("store_settings")
          .select("*")
          .eq("store_id", storeData.id)
          .single()

        if (mounted) {
          setStore(storeData)
          setSettings(settingsData || null)
          setMp(settingsData?.mercadopago_public_key || "")
          setMpAccountId(settingsData?.mercadopago_account_id || "")
        }
      } catch (err) {
        if (mounted) {
          console.error("Error loading store settings:", err)
          setError("Error al cargar la configuración")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadStore()

    return () => {
      mounted = false
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            No se encontró información de la tienda. Por favor completa el onboarding primero.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Tienda</h1>
        <p className="text-muted-foreground">Gestiona la información, imágenes, horarios y métodos de pago</p>
      </div>

      <StoreSettingsForm store={store} settings={settings} mp={mp} mp_account_id={mpAccountId} />
    </div>
  )
}
