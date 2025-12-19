import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: store } = await supabase.from("stores").select("*").eq("owner_id", user.id).single()

  // 🔒 CONTROL DE ACCESO: Verificar suscripción activa
  const headersList = await headers()
  const pathname = headersList.get("x-pathname") || ""

  // Rutas que permiten acceso sin suscripción activa
  const allowedPathsWithoutSubscription = [
    '/admin/setup',
    '/admin/renew',
    '/admin/subscription',
    '/admin/profile' // Permitir ver perfil para gestionar suscripción
  ]

  // Verificar si la ruta actual está permitida sin suscripción
  const isAllowedPath = allowedPathsWithoutSubscription.some(path => 
    pathname.startsWith(path)
  )

  // Solo verificar suscripción si la tienda existe y no estamos en ruta permitida
  if (store && !isAllowedPath) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Estados válidos de suscripción
    const validStatuses = ['trial', 'active']
    
    // Si no tiene suscripción O el estado no es válido
    const hasValidSubscription = subscription && validStatuses.includes(subscription.status)
    
    // Si no tiene suscripción válida, redirigir
    if (!hasValidSubscription) {
      // Redirigir a setup si nunca tuvo suscripción, o a renew si la tuvo
      const hasHadSubscription = subscription !== null
      
      if (hasHadSubscription) {
        // Ya tuvo suscripción pero expiró/canceló -> /admin/renew
        redirect("/admin/renew")
      } else {
        // Nunca tuvo suscripción -> /admin/setup
        redirect("/admin/setup")
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar store={store} />
      <div className="lg:pl-64">
        <AdminHeader user={user} store={store} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
