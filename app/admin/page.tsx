import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardStats } from "@/components/admin/dashboard-stats"
import { RecentOrders } from "@/components/admin/recent-orders"
import { QuickActions } from "@/components/admin/quick-actions"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user's store
  const { data: store } = await supabase.from("stores").select("*").eq("owner_id", user.id).single()

  if (!store) {
    redirect("/admin/setup")
  }

  // Get dashboard data
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: stats } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .eq("store_id", store.id)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de administración</h1>
        <p className="text-muted-foreground">Bienvenido de vuelta, {store.name}</p>
      </div>

      <DashboardStats stats={stats || []} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOrders orders={orders || []} />
        </div>
        <div>
          <QuickActions store={store} />
        </div>
      </div>
    </div>
  )
}
