import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrdersTable } from "@/components/admin/orders-table"

export default async function OrdersPage() {
  const supabase = await createClient()

  // 1. Usuario autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // 2. Tienda del usuario
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select(
      `
      id,
      name,
      phone,
      address,
      is_onboarded
    `
    )
    .eq("owner_id", user.id)
    .single()

  if (storeError || !store || !store.is_onboarded) {
    redirect("/onboarding")
  }

  // 3. Pedidos de la tienda (en paralelo podríamos traer más cosas si hiciera falta)
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      store_id,
      customer_name,
      customer_phone,
      customer_email,
      delivery_type,
      delivery_address,
      delivery_notes,
      subtotal,
      delivery_fee,
      total,
      status,
      payment_status,
      payment_id,
      estimated_delivery_time,
      notes,
      created_at,
      updated_at,
      order_items (
        id,
        quantity,
        unit_price,
        total_price,
        selected_options,
        products (
          name,
          product_options (
            id,
            name,
            type,
            product_option_values (
              id,
              name
            )
          )
        )
      ),
      payments (
        id,
        payment_method,
        provider,
        status
      )
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(20)



  // Si hay un error al traer pedidos, mostramos la tabla vacía
  const safeOrders = ordersError || !orders ? [] : orders

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground">Gestiona los pedidos de tu tienda</p>
      </div>

      <OrdersTable
        orders={safeOrders}
        store={{
          name: store.name ?? "",
          phone: store.phone ?? "",
          address: store.address ?? "",
        }}
      />
    </div>
  )
}
