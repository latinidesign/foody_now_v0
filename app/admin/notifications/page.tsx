import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NotificationSettings } from "@/components/admin/notification-settings"

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

  if (!store) {
    redirect("/admin/setup")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground">
          Configura las notificaciones push y WhatsApp para tu tienda
        </p>
      </div>

      <NotificationSettings storeId={store.id} storeName={store.name} />
    </div>
  )
}
