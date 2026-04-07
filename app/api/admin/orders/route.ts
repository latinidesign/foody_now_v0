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
      *,
      order_items (
        *,
        products (name)
      ),
      payments (id, payment_method, provider, status)
    `)
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  if (ordersError) {
    console.error("Error fetching admin orders:", ordersError)
    return NextResponse.json({ error: "Unable to fetch orders" }, { status: 500 })
  }

  return NextResponse.json({ orders: orders ?? [] })
}
