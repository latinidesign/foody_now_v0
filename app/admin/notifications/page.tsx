import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
// import { NotificationSettings } from "@/components/admin/notification-settings"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .single()

  if (!store || !store.is_onboarded) {
    redirect("/onboarding")
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground text-yellow-600 mt-4">
          ⚠️ Las notificaciones push están temporalmente deshabilitadas mientras se implementa una solución PWA adecuada.
        </p>
      </div>
      {/* NotificationSettings temporarily disabled */}
      {/* <NotificationSettings storeId={store.id} /> */}
    </div>
  )
}
