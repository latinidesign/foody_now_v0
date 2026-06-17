import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { SubscriptionGuard } from "@/components/admin/subscription-guard"
import { TrialAlert } from "@/components/admin/trial-alert"
import { PricingRefactorBanner } from "@/components/admin/pricing-refactor-banner"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("owner_id", user.id).single()

  // Si no hay tienda o no está onboarded, redirigir a onboarding
  if (!store || !store.is_onboarded) {
    redirect("/onboarding")
  }

  const { data: storeSettings } = await supabase
    .from("store_settings")
    .select("pricing_refactor_acknowledged_at")
    .eq("store_id", store.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar store={store} />
      <div className="lg:pl-64">
        <AdminHeader user={user} store={store} />
        <main className="p-6">
          <PricingRefactorBanner
            storeId={store.id}
            acknowledgedAt={storeSettings?.pricing_refactor_acknowledged_at ?? null}
          />
          <TrialAlert trialEndsAt={store.trial_ends_at} userCreatedAt={user.created_at} />
          <SubscriptionGuard storeId={store?.id || null}>
            {children}
          </SubscriptionGuard>
        </main>
      </div>
    </div>
  )
}
