import { WhatsAppSettings } from "@/components/admin/whatsapp-settings"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function WhatsAppSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: store } = await supabase
    .from("stores")
    .select("*, store_settings(*)")
    .eq("owner_id", user.id)
    .single()

  if (!store) {
    redirect("/admin/setup")
  }
  const storeSettings = Array.isArray(store.store_settings)
    ? store.store_settings[0]
    : store.store_settings || undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground">
          Configura la integración con WhatsApp para recibir y enviar notificaciones
        </p>
      </div>

      <WhatsAppSettings
        storeId={store.id}
        storeSlug={store.slug}
        storeName={store.name}
        currentPhone={storeSettings?.whatsapp_number || store.whatsapp_number || undefined}
        autoNotifications={storeSettings?.whatsapp_notifications_enabled ?? undefined}
        initialMessage={storeSettings?.whatsapp_message ?? undefined}
        waPhoneNumberId={storeSettings?.wa_phone_number_id ?? undefined}
        waBusinessAccountId={storeSettings?.wa_business_account_id ?? undefined}
        waAccessToken={storeSettings?.wa_access_token ?? undefined}
        waDefaultWelcomeTemplate={storeSettings?.wa_default_welcome_template ?? undefined}
        waDefaultOrderTemplate={storeSettings?.wa_default_order_template ?? undefined}
      />
    </div>
  )
}
