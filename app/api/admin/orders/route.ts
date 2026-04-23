import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (storeError || !store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 })
  }

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
        products (
          name
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

  if (ordersError) {
    console.error("Error fetching admin orders:", ordersError)
    return NextResponse.json({ error: "Unable to fetch orders" }, { status: 500 })
  }

  return NextResponse.json({ orders: orders ?? [] })
}
