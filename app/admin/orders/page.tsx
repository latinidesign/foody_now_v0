import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrdersTable } from "@/components/admin/orders-table"

export default async function OrdersPage() {
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

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (name)
      )
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gestiona los pedidos de tu tienda</p>
      </div>

      <OrdersTable orders={orders || []} />
    </div>
  )
}
