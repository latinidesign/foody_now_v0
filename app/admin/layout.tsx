import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
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
