import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StoreSettingsForm } from "@/components/admin/store-settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("owner_id", user.id).single()

  if (!store) {
    redirect("/admin/setup")
  }

  const { data: settings } = await supabase.from("store_settings").select("*").eq("store_id", store.id).single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Gestiona la configuración de tu tienda</p>
      </div>

      <StoreSettingsForm store={store} settings={settings} />
    </div>
  )
}
