import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { TrialAlert } from "@/components/admin/trial-alert"

export default async function StoreSettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Obtener tienda solo para pasar al sidebar, sin redirigir si no existe
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar store={store} />
      <div className="lg:pl-64">
        <AdminHeader user={user} store={store} />
        <main className="p-6">
          <TrialAlert trialEndsAt={store?.trial_ends_at} userCreatedAt={user.created_at} />
          {children}
        </main>
      </div>
    </div>
  )
}
