"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getBrowserClient } from "@/lib/supabase/client"
import { StoreSettingsForm } from "@/components/admin/store-settings-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Store, StoreSettings } from "@/lib/types/database"

export default function StoreSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<Store | null>(null)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [mpStatus, setMpStatus] = useState<"connected" | "disconnected">("disconnected")
  const [mpData, setMpData] = useState<any>(null)
  const [defaultTab, setDefaultTab] = useState<string>("store")
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true

    const loadStore = async () => {
      const supabase = getBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/auth/login")
        return
      }

      // Detectar si venimos del callback de MercadoPago
      const section = searchParams.get("section")
      if (section === "payments") {
        setDefaultTab("payments")
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

        // Cargar datos de cuenta de MercadoPago
        const { data: mpAccountData } = await supabase
          .from("mp_accounts")
          .select("*")
          .eq("store_id", storeData.id)
          .single()

        if (mounted) {
          setStore(storeData)
          setSettings(settingsData || null)
          
          if (mpAccountData && mpAccountData.status === "connected") {
            setMpStatus("connected")
            setMpData(mpAccountData)
          } else {
            setMpStatus("disconnected")
          }
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

      <StoreSettingsForm store={store} settings={settings} mpStatus={mpStatus} mpData={mpData} defaultTab={defaultTab} />
    </div>
  )
}
