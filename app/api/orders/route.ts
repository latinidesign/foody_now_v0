import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { storeId, items, orderData, subtotal, deliveryFee, total } = await request.json()

    const supabase = createAdminClient()

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        store_id: storeId,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail || null,
        delivery_type: orderData.deliveryType,
        delivery_address: orderData.deliveryAddress || null,
        delivery_notes: orderData.deliveryNotes || null,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single()

    if (orderError) {
      console.error("Order creation error:", orderError)
      return NextResponse.json({ error: "Error creating order" }, { status: 500 })
    }

    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      selected_options: item.selectedOptions || null,
    }))

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

    if (itemsError) {
      console.error("Order items creation error:", itemsError)
      return NextResponse.json({ error: "Error creating order items" }, { status: 500 })
    }

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
